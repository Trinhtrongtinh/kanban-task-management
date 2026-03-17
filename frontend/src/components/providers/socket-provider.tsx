'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '@/hooks/data/use-notifications';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user?.id) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

        // Connect to notifications namespace
        const socketInstance = io(`${backendUrl}/notifications`, {
            query: { userId: user.id },
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected to notifications namespace');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        socketInstance.on('new_notification', (notification) => {
            // Invalidate queries to refresh notification list and count
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });

            // Show a toast for the new notification
            toast(notification.title, {
                description: notification.message,
                action: {
                    label: 'Xem',
                    onClick: () => {
                        // Logic to open bell or navigate
                    }
                }
            });
        });

        socketInstance.on('notification_read', () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        });

        socketInstance.on('all_notifications_read', () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.id, queryClient]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
