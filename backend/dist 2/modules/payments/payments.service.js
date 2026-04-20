"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const stripe_service_1 = require("./stripe.service");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const utils_1 = require("../../common/utils");
const notifications_service_1 = require("../notifications/notifications.service");
const mailer_service_1 = require("../notifications/mailer.service");
const notification_entity_1 = require("../../database/entities/notification.entity");
const config_1 = require("../../config");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    userRepository;
    dataSource;
    stripeService;
    app;
    stripe;
    notificationsService;
    mailerService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(userRepository, dataSource, stripeService, app, stripe, notificationsService, mailerService) {
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.stripeService = stripeService;
        this.app = app;
        this.stripe = stripe;
        this.notificationsService = notificationsService;
        this.mailerService = mailerService;
    }
    async createCheckoutSession(createCheckoutDto, userId) {
        if (!this.stripeService.isInitialized()) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INTERNAL_ERROR, common_1.HttpStatus.SERVICE_UNAVAILABLE, 'Payment service is not available');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        const frontendUrl = this.app.frontendUrl;
        const successUrl = createCheckoutDto.successUrl ||
            `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = createCheckoutDto.cancelUrl || `${frontendUrl}/payment/cancel`;
        const priceId = createCheckoutDto.priceId ||
            this.stripe.proPriceId;
        if (!priceId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.VALIDATION_ERROR, common_1.HttpStatus.BAD_REQUEST, 'Price ID is required');
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
            url: session.url,
            sessionId: session.id,
        };
    }
    async handleWebhook(payload, signature) {
        const webhookSecret = this.stripe.webhookSecret;
        if (!webhookSecret || webhookSecret === 'whsec_xxx') {
            this.logger.error('Stripe webhook secret not configured');
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INTERNAL_ERROR, common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'Webhook not configured');
        }
        let event;
        try {
            event = this.stripeService.constructWebhookEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.VALIDATION_ERROR, common_1.HttpStatus.BAD_REQUEST, 'Invalid webhook signature');
        }
        this.logger.log(`Received Stripe event: ${event.type}`);
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
    async handleCheckoutCompleted(session) {
        const userId = session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        if (!userId) {
            this.logger.error('No client_reference_id found in checkout session');
            return;
        }
        this.logger.log(`Processing checkout completion for user: ${userId}`);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const user = await queryRunner.manager.findOne(entities_1.User, {
                where: { id: userId },
            });
            if (!user) {
                this.logger.error(`User not found: ${userId}`);
                await queryRunner.rollbackTransaction();
                return;
            }
            const subscription = subscriptionId
                ? await this.stripeService.retrieveSubscription(subscriptionId)
                : null;
            const expiredAt = this.resolveProExpiryDate(subscription, user.expiredAt);
            await queryRunner.manager.update(entities_1.User, userId, {
                planType: entities_1.PlanType.PRO,
                expiredAt,
                stripeCustomerId: customerId,
            });
            await queryRunner.commitTransaction();
            this.logger.log(`User ${userId} upgraded to PRO. Expires: ${expiredAt}`);
            this.sendUpgradeNotifications(user, expiredAt).catch((err) => {
                this.logger.error(`Failed to send upgrade notifications: ${err.message}`);
            });
        }
        catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            this.logger.error(`Failed to process checkout: ${error.message}`);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async handleSubscriptionUpdated(subscription) {
        const customerId = subscription.customer;
        const user = await this.userRepository.findOne({
            where: { stripeCustomerId: customerId },
        });
        if (!user) {
            this.logger.warn(`User not found for customer: ${customerId}`);
            return;
        }
        const expiredAt = this.resolveProExpiryDate(subscription, user.expiredAt);
        const status = subscription.status;
        if (status === 'active') {
            await this.userRepository.update(user.id, {
                planType: entities_1.PlanType.PRO,
                expiredAt,
            });
            this.logger.log(`Subscription renewed for user ${user.id}. New expiry: ${expiredAt}`);
        }
        else if (status === 'canceled' || status === 'unpaid') {
            await this.userRepository.update(user.id, {
                planType: entities_1.PlanType.FREE,
                expiredAt: null,
            });
            this.logger.log(`Subscription ${status} for user ${user.id}`);
        }
    }
    async handleSubscriptionDeleted(subscription) {
        const customerId = subscription.customer;
        const user = await this.userRepository.findOne({
            where: { stripeCustomerId: customerId },
        });
        if (!user) {
            this.logger.warn(`User not found for customer: ${customerId}`);
            return;
        }
        await this.userRepository.update(user.id, {
            planType: entities_1.PlanType.FREE,
            expiredAt: null,
        });
        this.logger.log(`Subscription cancelled for user ${user.id}`);
        this.sendCancellationNotification(user).catch((err) => {
            this.logger.error(`Failed to send cancellation notification: ${err.message}`);
        });
    }
    async handlePaymentFailed(invoice) {
        const customerId = invoice.customer;
        const user = await this.userRepository.findOne({
            where: { stripeCustomerId: customerId },
        });
        if (!user) {
            this.logger.warn(`User not found for customer: ${customerId}`);
            return;
        }
        this.logger.warn(`Payment failed for user ${user.id}`);
        await this.notificationsService.create({
            userId: user.id,
            type: notification_entity_1.NotificationType.PAYMENT_NOTIFICATION,
            title: 'Thanh toán thất bại',
            message: 'Thanh toán gói PRO của bạn không thành công. Vui lòng cập nhật phương thức thanh toán.',
            link: '/settings/billing',
        });
    }
    async sendUpgradeNotifications(user, expiredAt) {
        await this.notificationsService.create({
            userId: user.id,
            type: notification_entity_1.NotificationType.PAYMENT_NOTIFICATION,
            title: '🎉 Nâng cấp thành công!',
            message: `Tài khoản của bạn đã được nâng cấp lên gói PRO. Hết hạn: ${expiredAt.toLocaleDateString('vi-VN')}`,
            link: '/settings/billing',
        });
        await this.mailerService.sendUpgradeSuccessEmail(user.email, user.username, expiredAt);
    }
    async sendCancellationNotification(user) {
        await this.notificationsService.create({
            userId: user.id,
            type: notification_entity_1.NotificationType.PAYMENT_NOTIFICATION,
            title: 'Hủy gói PRO',
            message: 'Gói PRO của bạn đã bị hủy. Bạn vẫn có thể sử dụng các tính năng cơ bản.',
            link: '/settings/billing',
        });
    }
    async verifySession(sessionId, userId) {
        if (!this.stripeService.isInitialized()) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INTERNAL_ERROR, common_1.HttpStatus.SERVICE_UNAVAILABLE, 'Payment service is not available');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        await this.syncExpiredPlanState(user);
        if ((0, utils_1.isProPlanActive)(user)) {
            return { upgraded: true };
        }
        const session = await this.stripeService.retrieveSession(sessionId);
        if (session.client_reference_id !== userId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.VALIDATION_ERROR, common_1.HttpStatus.FORBIDDEN, 'Session does not belong to this user');
        }
        if (session.status !== 'complete' || session.payment_status !== 'paid') {
            return { upgraded: false };
        }
        await this.handleCheckoutCompleted(session);
        return { upgraded: true };
    }
    async getBillingInfo(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        await this.syncExpiredPlanState(user);
        return {
            planType: (0, utils_1.isProPlanActive)(user) ? entities_1.PlanType.PRO : entities_1.PlanType.FREE,
            expiredAt: (0, utils_1.isProPlanActive)(user) ? user.expiredAt : null,
            hasStripeCustomer: !!user.stripeCustomerId,
        };
    }
    async createPortalSession(userId) {
        if (!this.stripeService.isInitialized()) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INTERNAL_ERROR, common_1.HttpStatus.SERVICE_UNAVAILABLE, 'Payment service is not available');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || !user.stripeCustomerId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.BAD_REQUEST, 'No subscription found');
        }
        const frontendUrl = this.app.frontendUrl;
        const session = await this.stripeService.createPortalSession(user.stripeCustomerId, `${frontendUrl}/settings/billing`);
        return { url: session.url };
    }
    resolveProExpiryDate(subscription, currentExpiry) {
        const subscriptionWithPeriod = subscription;
        const stripeExpiry = (0, utils_1.toValidDate)(typeof subscriptionWithPeriod?.current_period_end === 'number'
            ? subscriptionWithPeriod.current_period_end * 1000
            : null);
        if (stripeExpiry) {
            return stripeExpiry;
        }
        const baseDate = currentExpiry && !(0, utils_1.isPlanExpired)(currentExpiry) ? currentExpiry : new Date();
        return (0, utils_1.getDefaultProExpiry)(baseDate);
    }
    async syncExpiredPlanState(user) {
        if (user.planType !== entities_1.PlanType.PRO) {
            return;
        }
        if (!user.expiredAt) {
            user.expiredAt = (0, utils_1.getDefaultProExpiry)();
            await this.userRepository.save(user);
            return;
        }
        if (!(0, utils_1.isPlanExpired)(user.expiredAt)) {
            return;
        }
        user.planType = entities_1.PlanType.FREE;
        user.expiredAt = null;
        await this.userRepository.save(user);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(3, (0, common_1.Inject)(config_1.appConfig.KEY)),
    __param(4, (0, common_1.Inject)(config_1.stripeConfig.KEY)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        stripe_service_1.StripeService, void 0, void 0, notifications_service_1.NotificationsService,
        mailer_service_1.MailerService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map