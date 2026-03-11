import { apiClient } from './client';

export type PlanType = 'FREE' | 'PRO';

export interface BillingInfo {
  planType: PlanType;
  expiredAt: string | null;
  hasStripeCustomer: boolean;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export const paymentsApi = {
  /**
   * Create a Stripe Checkout session — returns the Stripe URL to redirect to.
   */
  createCheckoutSession: async (priceId?: string): Promise<CheckoutSession> => {
    const response = await apiClient.post<{ data: CheckoutSession }>(
      '/payments/create-checkout-session',
      priceId ? { priceId } : {},
    );
    return response.data.data;
  },

  /**
   * Get current authenticated user's billing/plan info.
   */
  getBillingInfo: async (): Promise<BillingInfo> => {
    const response = await apiClient.get<{ data: BillingInfo }>('/payments/billing');
    return response.data.data;
  },

  /**
   * Create a Stripe Customer Portal session for managing an existing subscription.
   */
  createPortalSession: async (): Promise<{ url: string }> => {
    const response = await apiClient.post<{ data: { url: string } }>('/payments/portal-session');
    return response.data.data;
  },
};
