import { apiClient } from './client';

// ── Types matching backend responses ─────────────────────────────────

export type PlanType = 'FREE' | 'PRO';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  planType?: PlanType;
  expiredAt?: string | null;
  stripeCustomerId?: string | null;
  notifyDueDateEmail?: boolean;
  notifyMentionEmail?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  data: {
    user: AuthUser;
    accessToken: string;
  };
  message: string;
  statusCode: number;
}

// ── DTOs ──────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetTokenPayload {
  token: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

// ── API calls ─────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /api/auth/login
   * Returns { user, accessToken }
   */
  login: async (payload: LoginPayload): Promise<AuthResponse['data']> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload);
    return res.data.data;
  },

  /**
   * POST /api/auth/register
   * Returns { user, accessToken }
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse['data']> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    return res.data.data;
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ data: { success: boolean } }>(
      '/auth/forgot-password',
      payload,
    );
    return res.data.data;
  },

  verifyResetToken: async (
    payload: VerifyResetTokenPayload,
  ): Promise<{ valid: boolean }> => {
    const res = await apiClient.post<{ data: { valid: boolean } }>(
      '/auth/verify-reset-token',
      payload,
    );
    return res.data.data;
  },

  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ data: { success: boolean } }>(
      '/auth/reset-password',
      payload,
    );
    return res.data.data;
  },

  /**
   * GET /api/auth/me (requires JWT)
   * Returns the current user profile
   */
  getMe: async (): Promise<AuthUser> => {
    const res = await apiClient.get<{ data: AuthUser }>('/auth/me');
    return res.data.data;
  },
};
