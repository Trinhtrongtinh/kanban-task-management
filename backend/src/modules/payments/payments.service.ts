import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { User, PlanType } from '../../database/entities';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '../notifications/mailer.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    createCheckoutDto: CreateCheckoutDto,
    userId: string,
  ): Promise<{ url: string; sessionId: string }> {
    if (!this.stripeService.isInitialized()) {
      throw new BusinessException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Payment service is not available',
      );
    }

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const successUrl =
      createCheckoutDto.successUrl ||
      `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      createCheckoutDto.cancelUrl || `${frontendUrl}/payment/cancel`;

    // Use priceId from request or fallback to env
    const priceId =
      createCheckoutDto.priceId ||
      this.configService.get<string>('STRIPE_PRO_PRICE_ID');
    if (!priceId) {
      throw new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Price ID is required',
      );
    }

    const session = await this.stripeService.createCheckoutSession({
      priceId,
      userId,
      customerEmail: user.email,
      successUrl,
      cancelUrl,
      stripeCustomerId: user.stripeCustomerId || undefined,
    });

    return {
      url: session.url!,
      sessionId: session.id,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret || webhookSecret === 'whsec_xxx') {
      this.logger.error('Stripe webhook secret not configured');
      throw new BusinessException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Webhook not configured',
      );
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Invalid webhook signature',
      );
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout.session.completed event
   */
  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId) {
      this.logger.error('No client_reference_id found in checkout session');
      return;
    }

    this.logger.log(`Processing checkout completion for user: ${userId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        this.logger.error(`User not found: ${userId}`);
        await queryRunner.rollbackTransaction();
        return;
      }

      // Get subscription to determine expiration
      const subscription =
        await this.stripeService.retrieveSubscription(subscriptionId);
      const expiredAt = new Date(
        (subscription as any).current_period_end * 1000,
      );

      // Update user
      await queryRunner.manager.update(User, userId, {
        planType: PlanType.PRO,
        expiredAt,
        stripeCustomerId: customerId,
      });

      await queryRunner.commitTransaction();

      this.logger.log(`User ${userId} upgraded to PRO. Expires: ${expiredAt}`);

      // Send notifications (after commit, non-blocking)
      this.sendUpgradeNotifications(user, expiredAt).catch((err) => {
        this.logger.error(
          `Failed to send upgrade notifications: ${err.message}`,
        );
      });
    } catch (error) {
      // Only rollback if transaction is still active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(`Failed to process checkout: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle subscription updated (renewal, plan change)
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.customer as string;

    const user = await this.userRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.warn(`User not found for customer: ${customerId}`);
      return;
    }

    const expiredAt = new Date((subscription as any).current_period_end * 1000);
    const status = subscription.status;

    if (status === 'active') {
      await this.userRepository.update(user.id, {
        planType: PlanType.PRO,
        expiredAt,
      });
      this.logger.log(
        `Subscription renewed for user ${user.id}. New expiry: ${expiredAt}`,
      );
    } else if (status === 'canceled' || status === 'unpaid') {
      await this.userRepository.update(user.id, {
        planType: PlanType.FREE,
        expiredAt: null,
      });
      this.logger.log(`Subscription ${status} for user ${user.id}`);
    }
  }

  /**
   * Handle subscription deleted (cancellation)
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.customer as string;

    const user = await this.userRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.warn(`User not found for customer: ${customerId}`);
      return;
    }

    await this.userRepository.update(user.id, {
      planType: PlanType.FREE,
      expiredAt: null,
    });

    this.logger.log(`Subscription cancelled for user ${user.id}`);

    // Send cancellation notification
    this.sendCancellationNotification(user).catch((err) => {
      this.logger.error(
        `Failed to send cancellation notification: ${err.message}`,
      );
    });
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const user = await this.userRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.warn(`User not found for customer: ${customerId}`);
      return;
    }

    this.logger.warn(`Payment failed for user ${user.id}`);

    // Send payment failed notification
    await this.notificationsService.create({
      userId: user.id,
      type: NotificationType.PAYMENT_NOTIFICATION,
      title: 'Thanh toán thất bại',
      message:
        'Thanh toán gói PRO của bạn không thành công. Vui lòng cập nhật phương thức thanh toán.',
      link: '/settings/billing',
    });
  }

  /**
   * Send upgrade success notifications
   */
  private async sendUpgradeNotifications(
    user: User,
    expiredAt: Date,
  ): Promise<void> {
    // In-app notification
    await this.notificationsService.create({
      userId: user.id,
      type: NotificationType.PAYMENT_NOTIFICATION,
      title: '🎉 Nâng cấp thành công!',
      message: `Tài khoản của bạn đã được nâng cấp lên gói PRO. Hết hạn: ${expiredAt.toLocaleDateString('vi-VN')}`,
      link: '/settings/billing',
    });

    // Email notification
    await this.mailerService.sendUpgradeSuccessEmail(
      user.email,
      user.username,
      expiredAt,
    );
  }

  /**
   * Send subscription cancellation notification
   */
  private async sendCancellationNotification(user: User): Promise<void> {
    await this.notificationsService.create({
      userId: user.id,
      type: NotificationType.PAYMENT_NOTIFICATION,
      title: 'Hủy gói PRO',
      message:
        'Gói PRO của bạn đã bị hủy. Bạn vẫn có thể sử dụng các tính năng cơ bản.',
      link: '/settings/billing',
    });
  }

  /**
   * Get user's billing info
   */
  async getBillingInfo(userId: string): Promise<{
    planType: PlanType;
    expiredAt: Date | null;
    hasStripeCustomer: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      planType: user.planType,
      expiredAt: user.expiredAt,
      hasStripeCustomer: !!user.stripeCustomerId,
    };
  }

  /**
   * Create customer portal session for managing subscription
   */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    if (!this.stripeService.isInitialized()) {
      throw new BusinessException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Payment service is not available',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        'No subscription found',
      );
    }

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const session = await this.stripeService.createPortalSession(
      user.stripeCustomerId,
      `${frontendUrl}/settings/billing`,
    );

    return { url: session.url };
  }
}
