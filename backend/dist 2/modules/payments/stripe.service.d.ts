import type { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import { stripeConfig } from '../../config';
export declare class StripeService {
    private readonly stripeSettings;
    private readonly logger;
    private stripe;
    constructor(stripeSettings: ConfigType<typeof stripeConfig>);
    createCheckoutSession(params: {
        priceId: string;
        userId: string;
        customerEmail: string;
        successUrl: string;
        cancelUrl: string;
        stripeCustomerId?: string;
    }): Promise<Stripe.Checkout.Session>;
    constructWebhookEvent(payload: Buffer, signature: string, webhookSecret: string): Stripe.Event;
    retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session>;
    retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session>;
    isInitialized(): boolean;
}
