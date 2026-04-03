import { apiClient } from './client';

export enum NotificationType {
    DEADLINE_REMINDER = 'DEADLINE_REMINDER',
    CARD_ASSIGNED = 'CARD_ASSIGNED',
    COMMENT_ADDED = 'COMMENT_ADDED',
    CARD_MOVED = 'CARD_MOVED',
    MENTION = 'MENTION',
    WORKSPACE_INVITE = 'WORKSPACE_INVITE',
    PAYMENT_NOTIFICATION = 'PAYMENT_NOTIFICATION',
    BOARD_MEMBER_ADDED = 'BOARD_MEMBER_ADDED',
}

export interface Notification {
    id: string;
    userId: string;
    cardId: string | null;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    metadata: Record<string, any> | null;
    createdAt: string;
}

export const notificationsApi = {
    getNotifications: async (): Promise<Notification[]> => {
        const response = await apiClient.get<{ data: Notification[] }>('/notifications');
        return response.data.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await apiClient.get<{ data: { count: number } }>('/notifications/unread-count');
        return response.data.data.count;
    },

    markAsRead: async (id: string): Promise<Notification> => {
        const response = await apiClient.patch<{ data: Notification }>(`/notifications/${id}/read`);
        return response.data.data;
    },

    markAllAsRead: async (): Promise<void> => {
        await apiClient.post('/notifications/mark-all-read');
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/notifications/${id}`);
    },

    deleteAll: async (): Promise<void> => {
        await apiClient.delete('/notifications');
    },
};
