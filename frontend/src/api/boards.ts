import { apiClient } from './client';

export interface Board {
    id: string;
    title: string;
    slug: string;
    visibility: 'Private' | 'Workspace' | 'Public';
    backgroundUrl: string | null;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBoardPayload {
    title: string;
    workspaceId: string;
    slug?: string;
    backgroundUrl?: string;
    visibility?: 'Private' | 'Workspace' | 'Public';
}

export interface UpdateBoardPayload {
    title?: string;
    slug?: string;
    backgroundUrl?: string;
    visibility?: 'Private' | 'Workspace' | 'Public';
}

interface GetBoardsByWorkspaceOptions {
    joinedOnly?: boolean;
}

export const boardsApi = {
    // Get all boards in a workspace
    getBoardsByWorkspace: async (
        workspaceId: string,
        options?: GetBoardsByWorkspaceOptions,
    ): Promise<Board[]> => {
        const response = await apiClient.get<{ data: Board[] }>(`/boards/workspace/${workspaceId}`, {
            params: {
                joinedOnly: options?.joinedOnly,
            },
        });
        return response.data.data;
    },

    // Get a single board by ID
    getBoardById: async (id: string): Promise<Board> => {
        const response = await apiClient.get<{ data: Board }>(`/boards/${id}`);
        return response.data.data;
    },

    // Create a new board
    create: async (payload: CreateBoardPayload): Promise<Board> => {
        const response = await apiClient.post<{ data: Board }>('/boards', payload);
        return response.data.data;
    },

    // Update a board
    update: async (id: string, payload: UpdateBoardPayload): Promise<Board> => {
        const response = await apiClient.patch<{ data: Board }>(`/boards/${id}`, payload);
        return response.data.data;
    },

    // Delete a board
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/boards/${id}`);
    },
};
