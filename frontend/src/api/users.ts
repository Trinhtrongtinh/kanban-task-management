import { apiClient } from './client';
import type { AuthUser } from './auth';

export interface UpdateProfilePayload {
  username: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationPreferencesPayload {
  notifyDueDateEmail: boolean;
  notifyMentionEmail: boolean;
}

export type RecentActivityFilter = 'today' | 'week' | 'all';

export interface RecentActivity {
  id: string;
  action: string;
  content: string;
  createdAt: string;
  boardId: string | null;
  cardId: string | null;
  entityTitle: string;
  details?: Record<string, unknown> | null;
  board?: {
    id: string;
    title: string;
  } | null;
  card?: {
    id: string;
    title: string;
  } | null;
}

export interface RecentActivityPage {
  items: RecentActivity[];
  nextCursor: string | null;
}

export interface GetRecentActivityParams {
  filter?: RecentActivityFilter;
  limit?: number;
  cursor?: string;
}

export const usersApi = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const response = await apiClient.patch<{ data: AuthUser }>('/users/me', payload);
    return response.data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.patch('/users/me/password', payload);
  },

  updateNotificationPreferences: async (
    payload: UpdateNotificationPreferencesPayload,
  ): Promise<AuthUser> => {
    const response = await apiClient.patch<{ data: AuthUser }>(
      '/users/me/notification-preferences',
      payload,
    );
    return response.data.data;
  },

  uploadAvatar: async (file: File): Promise<AuthUser> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ data: AuthUser }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/users/me');
  },

  getRecentActivity: async (params?: GetRecentActivityParams): Promise<RecentActivityPage> => {
    const response = await apiClient.get<{ data: RecentActivityPage }>('/activities/me', {
      params,
    });
    return response.data.data;
  },
};