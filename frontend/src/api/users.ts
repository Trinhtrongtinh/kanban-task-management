import { apiClient } from './client';
import type { AuthUser } from './auth';

export interface UpdateProfilePayload {
  username: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  content: string;
  createdAt: string;
  boardId: string;
  cardId: string | null;
  board?: {
    id: string;
    title: string;
  } | null;
  card?: {
    id: string;
    title: string;
  } | null;
}

export const usersApi = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const response = await apiClient.patch<{ data: AuthUser }>('/users/me', payload);
    return response.data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.patch('/users/me/password', payload);
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

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const response = await apiClient.get<{ data: RecentActivity[] }>('/activities/me');
    return response.data.data;
  },
};