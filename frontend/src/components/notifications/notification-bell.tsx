'use client';

import { Bell, Check, X, Loader2 } from 'lucide-react';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/use-notifications';
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
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { workspacesApi } from '@/api/workspaces';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/hooks/use-workspaces';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
    const router = useRouter();
    const { data: notifications = [] } = useNotifications();
    const { data: unreadCount = 0 } = useUnreadNotificationsCount();
    const markAsRead = useMarkNotificationAsRead();
    const markAllAsRead = useMarkAllNotificationsAsRead();
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

            // Handle cases where metadata might be a string (SQLite or certain drivers)
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

        try {
            if (!notification.isRead) {
                await markAsRead.mutateAsync(notification.id);
            }
        } catch {
            // Ignore read-state error so navigation still works
        }

        if (notification.link) {
            router.push(notification.link);
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
                    Thông báo
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                        >
                            Đánh dấu tất cả đã đọc
                        </Button>
                    )}
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
                                        e.preventDefault(); // Don't close if clicking invite buttons
                                        return;
                                    }

                                    await handleNotificationSelect(n);
                                }}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <span className={`text-sm font-semibold ${!n.isRead ? 'text-primary' : ''}`}>
                                        {n.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                                    </span>
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
