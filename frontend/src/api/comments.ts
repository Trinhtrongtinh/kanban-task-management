import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { io, Socket } from 'socket.io-client';

export interface Comment {
    id: string;
    cardId: string;
    user: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    content: string;
    createdAt: string;
    updatedAt: string;
}

export const commentsApi = {
    getByCard: async (cardId: string): Promise<Comment[]> => {
        const response = await apiClient.get<{ data: Comment[] }>(`/cards/${cardId}/comments`);
        return response.data.data;
    },
    create: async (
        cardId: string,
        payload: { content: string; mentionedUserIds?: string[]; mentionAll?: boolean },
    ): Promise<Comment> => {
        const response = await apiClient.post<{ data: Comment }>(`/cards/${cardId}/comments`, payload);
        return response.data.data;
    },
    update: async (id: string, content: string): Promise<Comment> => {
        const response = await apiClient.patch<{ data: Comment }>(`/comments/${id}`, { content });
        return response.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/comments/${id}`);
    },
};

export const commentKeys = {
    all: ['comments'] as const,
    byCard: (cardId: string) => [...commentKeys.all, cardId] as const,
};

function sortCommentsByTime(comments: Comment[]): Comment[] {
    return [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function useComments(cardId: string | undefined) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: commentKeys.byCard(cardId ?? ''),
        queryFn: () => commentsApi.getByCard(cardId ?? ''),
        enabled: !!cardId,
    });

    useEffect(() => {
        if (!cardId) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const socket: Socket = io(`${backendUrl}/comments`, {
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            socket.emit('joinCard', cardId);
        });

        socket.on('comment:created', (comment: Comment) => {
            queryClient.setQueryData<Comment[]>(commentKeys.byCard(cardId), (old = []) => {
                if (old.some((c) => c.id === comment.id)) return old;
                return sortCommentsByTime([...old, comment]);
            });
        });

        socket.on('comment:updated', (comment: Comment) => {
            queryClient.setQueryData<Comment[]>(commentKeys.byCard(cardId), (old = []) =>
                sortCommentsByTime(old.map((item) => (item.id === comment.id ? comment : item)))
            );
        });

        socket.on('comment:deleted', ({ commentId }: { commentId: string }) => {
            queryClient.setQueryData<Comment[]>(commentKeys.byCard(cardId), (old = []) =>
                old.filter((item) => item.id !== commentId)
            );
        });

        return () => {
            socket.emit('leaveCard', cardId);
            socket.disconnect();
        };
    }, [cardId, queryClient]);

    return query;
}

export function useCreateCommentMutation(cardId: string | undefined) {
    const queryClient = useQueryClient();
    const key = commentKeys.byCard(cardId ?? '');

    return useMutation({
        mutationFn: (payload: { content: string; mentionedUserIds: string[]; mentionAll: boolean }) =>
            commentsApi.create(cardId ?? '', payload),
        onSuccess: (createdComment) => {
            queryClient.setQueryData<Comment[]>(key, (old = []) => {
                if (old.some((item) => item.id === createdComment.id)) return old;
                return sortCommentsByTime([...old, createdComment]);
            });
        },
    });
}

export function useDeleteCommentMutation(cardId: string | undefined) {
    const queryClient = useQueryClient();
    const key = commentKeys.byCard(cardId ?? '');

    return useMutation({
        mutationFn: (commentId: string) => commentsApi.delete(commentId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    });
}
