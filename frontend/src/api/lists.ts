import { apiClient } from './client';

export interface List {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  cards?: any[]; // Keep any until Cards are integrated
}

export interface CreateListPayload {
  title: string;
  boardId: string;
}

export interface UpdateListPayload {
  title?: string;
  position?: number;
}

export const listsApi = {
  // Get all lists in a board
  getListsByBoard: async (boardId: string): Promise<List[]> => {
    const response = await apiClient.get<{ data: List[] }>(`/lists/board/${boardId}`);
    return response.data.data;
  },

  // Get a single list by ID
  getListById: async (id: string): Promise<List> => {
    const response = await apiClient.get<{ data: List }>(`/lists/${id}`);
    return response.data.data;
  },

  // Create a new list
  create: async (payload: CreateListPayload): Promise<List> => {
    const response = await apiClient.post<{ data: List }>('/lists', payload);
    return response.data.data;
  },

  // Update a list (rename or reorder)
  update: async (id: string, payload: UpdateListPayload): Promise<List> => {
    const response = await apiClient.patch<{ data: List }>(`/lists/${id}`, payload);
    return response.data.data;
  },

  // Delete a list
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/lists/${id}`);
  },

  // Restore a soft-deleted list
  restore: async (id: string): Promise<List> => {
    const response = await apiClient.patch<{ data: List }>(`/lists/${id}/restore`);
    return response.data.data;
  },
};
