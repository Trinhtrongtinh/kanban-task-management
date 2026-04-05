import { apiClient } from './client';
import { User } from '@/types';
import { Label } from '@/components/board/types';

export interface Card {
    id: string;
    listId: string;
    assigneeId?: string | null;
    assignee?: User | null;
    title: string;
    description?: string | null;
    position: number;
    deadline?: string | null;
    isReminded: boolean;
    isArchived: boolean;
    labels?: Label[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateCardPayload {
    listId: string;
    title: string;
    description?: string;
    deadline?: string;
    assigneeId?: string;
}

export interface UpdateCardPayload {
    title?: string;
    description?: string;
    deadline?: string;
    assigneeId?: string | null;
    isArchived?: boolean;
}

export interface MoveCardPayload {
    targetListId: string;
    prevCardId?: string;
    nextCardId?: string;
}

export const cardsApi = {
    // Create a new card
    create: async (payload: CreateCardPayload): Promise<Card> => {
        const response = await apiClient.post<{ data: Card }>('/cards', payload);
        return response.data.data;
    },

    // Get a single card by ID
    getById: async (id: string): Promise<Card> => {
        const response = await apiClient.get<{ data: Card }>(`/cards/${id}`);
        return response.data.data;
    },

    // Update a card
    update: async (id: string, payload: UpdateCardPayload): Promise<Card> => {
        const response = await apiClient.patch<{ data: Card }>(`/cards/${id}`, payload);
        return response.data.data;
    },

    // Delete a card
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/cards/${id}`);
    },

    // Restore a soft-deleted card
    restore: async (id: string): Promise<Card> => {
        const response = await apiClient.patch<{ data: Card }>(`/cards/${id}/restore`);
        return response.data.data;
    },

    // Move a card (drag and drop)
    move: async (id: string, payload: MoveCardPayload): Promise<Card> => {
        const response = await apiClient.patch<{ data: Card }>(`/cards/${id}/move`, payload);
        return response.data.data;
    },
};
