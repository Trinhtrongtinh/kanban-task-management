import { PaymentsService } from './payments.service';
import { CreateCheckoutDto, VerifySessionDto } from './dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    handleWebhook(signature: string, req: any): Promise<void>;
    verifySession(body: VerifySessionDto, userId: string): Promise<{
        upgraded: boolean;
    }>;
    createCheckoutSession(createCheckoutDto: CreateCheckoutDto, userId: string): Promise<{
        url: string;
        sessionId: string;
    }>;
    getBillingInfo(userId: string): Promise<{
        planType: import("../../database/entities").PlanType;
        expiredAt: Date | null;
        hasStripeCustomer: boolean;
    }>;
    createPortalSession(userId: string): Promise<{
        url: string;
    }>;
}
