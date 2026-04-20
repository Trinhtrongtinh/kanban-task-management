import { Repository, DataSource } from 'typeorm';
import type { ConfigType } from '@nestjs/config';
import { User, PlanType } from '../../database/entities';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '../notifications/mailer.service';
import { appConfig, stripeConfig } from '../../config';
export declare class PaymentsService {
    private readonly userRepository;
    private readonly dataSource;
    private readonly stripeService;
    private readonly app;
    private readonly stripe;
    private readonly notificationsService;
    private readonly mailerService;
    private readonly logger;
    constructor(userRepository: Repository<User>, dataSource: DataSource, stripeService: StripeService, app: ConfigType<typeof appConfig>, stripe: ConfigType<typeof stripeConfig>, notificationsService: NotificationsService, mailerService: MailerService);
    createCheckoutSession(createCheckoutDto: CreateCheckoutDto, userId: string): Promise<{
        url: string;
        sessionId: string;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<void>;
    private handleCheckoutCompleted;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
    private handlePaymentFailed;
    private sendUpgradeNotifications;
    private sendCancellationNotification;
    verifySession(sessionId: string, userId: string): Promise<{
        upgraded: boolean;
    }>;
    getBillingInfo(userId: string): Promise<{
        planType: PlanType;
        expiredAt: Date | null;
        hasStripeCustomer: boolean;
    }>;
    createPortalSession(userId: string): Promise<{
        url: string;
    }>;
    private resolveProExpiryDate;
    private syncExpiredPlanState;
}
