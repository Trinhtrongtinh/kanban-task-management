'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(boardId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      if (boardId) {
        socketRef.current?.emit('joinBoard', { boardId });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (boardId) {
        socketRef.current?.emit('leaveBoard', { boardId });
      }
      socketRef.current?.disconnect();
    };
  }, [accessToken, boardId]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    isConnected: socketRef.current?.connected ?? false,
  };
}
