import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { User } from '@/types';

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
    create: async (cardId: string, content: string): Promise<Comment> => {
        const response = await apiClient.post<{ data: Comment }>(`/cards/${cardId}/comments`, { content });
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

export function useComments(cardId: string | undefined) {
    return useQuery({
        queryKey: commentKeys.byCard(cardId ?? ''),
        queryFn: () => commentsApi.getByCard(cardId ?? ''),
        enabled: !!cardId,
    });
}

export function useCreateCommentMutation(cardId: string | undefined) {
    const queryClient = useQueryClient();
    const key = commentKeys.byCard(cardId ?? '');

    return useMutation({
        mutationFn: (content: string) => commentsApi.create(cardId ?? '', content),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
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
