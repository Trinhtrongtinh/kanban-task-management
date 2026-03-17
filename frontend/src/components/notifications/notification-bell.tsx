'use client';

import { Bell, Check, X, Loader2, Trash2 } from 'lucide-react';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, useDeleteAllNotifications } from '@/hooks/data/use-notifications';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationType } from '@/api/notifications';
import { workspacesApi } from '@/api/workspaces';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/hooks/data/use-workspaces';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDateTimeVN } from '@/lib/date-time';

export function NotificationBell() {
    const router = useRouter();
    const { data: notifications = [] } = useNotifications();
    const { data: unreadCount = 0 } = useUnreadNotificationsCount();
    const markAsRead = useMarkNotificationAsRead();
    const markAllAsRead = useMarkAllNotificationsAsRead();
    const deleteNotification = useDeleteNotification();
    const deleteAllNotifications = useDeleteAllNotifications();
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const parseMetadata = (metadata: unknown) => {
        if (!metadata) return null;
        if (typeof metadata === 'string') {
            try {
                return JSON.parse(metadata);
            } catch {
                return null;
            }
        }
        return metadata as Record<string, any>;
    };

    const handleAcceptInvite = async (
        notificationId: string,
        metadata: any
    ) => {
        try {
            setProcessingId(notificationId);

            const data = parseMetadata(metadata);
            const { workspaceId, inviteToken } = data || {};

            if (!workspaceId || !inviteToken) {
                throw new Error('Thiếu thông tin workspace hoặc token');
            }

            await workspacesApi.acceptInvite(workspaceId, inviteToken);
            await markAsRead.mutateAsync(notificationId);

            queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
            toast.success('Đã chấp nhận lời mời tham gia workspace');
        } catch (error: any) {
            console.error('Accept invite error:', error);
            toast.error(error?.response?.data?.message || error?.message || 'Không thể chấp nhận lời mời');
        } finally {
            setProcessingId(null);
        }
    };

    const handleNotificationSelect = async (notification: typeof notifications[number]) => {
        if (notification.type === NotificationType.WORKSPACE_INVITE) {
            return;
        }

        // For payment notifications, just mark as read without navigating
        if (notification.type === NotificationType.PAYMENT_NOTIFICATION) {
            if (!notification.isRead) {
                await markAsRead.mutateAsync(notification.id);
            }
            return;
        }

        try {
            if (!notification.isRead) {
                await markAsRead.mutateAsync(notification.id);
            }
        } catch {
            // Ignore read-state error so navigation still works
        }

        const data = parseMetadata(notification.metadata);
        const fallbackLink =
            data?.boardId && data?.cardId
                ? `/b/${data.boardId}?cardId=${data.cardId}&focus=activity`
                : null;

        const targetLink = notification.link || fallbackLink;
        if (targetLink) {
            try {
                const resolved = new URL(targetLink, window.location.origin);
                if (resolved.origin === window.location.origin) {
                    router.push(`${resolved.pathname}${resolved.search}${resolved.hash}`);
                } else {
                    window.location.href = targetLink;
                }
            } catch {
                router.push(targetLink);
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold">Thông báo</span>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                                onClick={() => markAllAsRead.mutate()}
                                disabled={markAllAsRead.isPending}
                            >
                                Đánh dấu đã đọc
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <>
                                {unreadCount > 0 && <span className="text-muted-foreground/40 text-xs">·</span>}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-destructive"
                                    onClick={() => deleteAllNotifications.mutate()}
                                    disabled={deleteAllNotifications.isPending}
                                >
                                    Xóa tất cả
                                </Button>
                            </>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Bell className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm">Không có thông báo nào</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className={`flex flex-col items-start gap-1 p-4 ${!n.isRead ? 'bg-primary/5' : ''}`}
                                onSelect={async (e) => {
                                    if (n.type === NotificationType.WORKSPACE_INVITE) {
                                        e.preventDefault();
                                        return;
                                    }

                                    await handleNotificationSelect(n);
                                }}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${!n.isRead ? 'text-primary' : ''}`}>
                                        {n.title}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                                            {formatDateTimeVN(n.createdAt)}
                                        </span>
                                        <button
                                            className="ml-1 flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
                                            aria-label="Xóa thông báo"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                deleteNotification.mutate(n.id);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {n.message}
                                </p>

                                {n.type === NotificationType.WORKSPACE_INVITE && !n.isRead && (
                                    <div className="mt-2 flex w-full gap-2">
                                        <Button
                                            size="sm"
                                            className="h-7 flex-1 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAcceptInvite(n.id, n.metadata);
                                            }}
                                            disabled={processingId === n.id}
                                        >
                                            {processingId === n.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="mr-1 h-3 w-3" />
                                                    Chấp nhận
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 flex-1 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead.mutate(n.id);
                                            }}
                                            disabled={processingId === n.id}
                                        >
                                            <X className="mr-1 h-3 w-3" />
                                            Bỏ qua
                                        </Button>
                                    </div>
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

