import { Injectable, Logger, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import { stripeConfig } from '../../config';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    @Inject(stripeConfig.KEY)
    private readonly stripeSettings: ConfigType<typeof stripeConfig>,
  ) {
    const secretKey = this.stripeSettings.secretKey;

    if (!secretKey || secretKey === 'sk_test_xxx') {
      this.logger.warn(
        'Stripe secret key not configured. Payment features will be disabled.',
      );
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    });

    this.logger.log('Stripe initialized successfully');
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    stripeCustomerId?: string;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized');
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
      },
    };

    // If customer exists, use their ID; otherwise, use email
    if (params.stripeCustomerId) {
      sessionParams.customer = params.stripeCustomerId;
    } else {
      sessionParams.customer_email = params.customerEmail;
    }

    return this.stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Construct and verify webhook event
   */
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }

  /**
   * Retrieve a checkout session
   */
  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized');
    }

    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
  }

  /**
   * Retrieve subscription details
   */
  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized');
    }

    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized');
    }

    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Create a customer portal session for managing subscription
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized');
    }

    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  isInitialized(): boolean {
    return !!this.stripe;
  }
}
