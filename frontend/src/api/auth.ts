import { apiClient } from './client';

// ── Types matching backend responses ─────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
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

  /**
   * GET /api/auth/me (requires JWT)
   * Returns the current user profile
   */
  getMe: async (): Promise<AuthUser> => {
    const res = await apiClient.get<{ data: AuthUser }>('/auth/me');
    return res.data.data;
  },
};
