import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, Notification } from '@/api/notifications';

export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export function useNotifications() {
    return useQuery({
        queryKey: notificationKeys.lists(),
        queryFn: notificationsApi.getNotifications,
        refetchInterval: 30000,
    });
}

export function useUnreadNotificationsCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: notificationsApi.getUnreadCount,
        refetchInterval: 30000,
    });
}

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.markAsRead,
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            queryClient.setQueryData<Notification[]>(notificationKeys.lists(), (old) =>
                old?.map((n) => (n.id === updated.id ? updated : n))
            );
        },
    });
}

export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.delete,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<Notification[]>(notificationKeys.lists(), (old) =>
                old?.filter((n) => n.id !== id)
            );
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
}

export function useDeleteAllNotifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.deleteAll,
        onSuccess: () => {
            queryClient.setQueryData<Notification[]>(notificationKeys.lists(), []);
            queryClient.setQueryData(notificationKeys.unreadCount(), 0);
        },
    });
}
