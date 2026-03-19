import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './client';
import type { Checklist, ChecklistItem } from '@/types';

// ── API calls ────────────────────────────────────────────────────────

const checklistsApi = {
  getByCard: async (cardId: string): Promise<Checklist[]> => {
    const response = await apiClient.get(`/cards/${cardId}/checklists`);
    return response.data.data;
  },
  create: async (cardId: string, title: string): Promise<Checklist> => {
    const response = await apiClient.post(`/cards/${cardId}/checklists`, { title });
    return response.data.data;
  },
  update: async (id: string, title: string): Promise<Checklist> => {
    const response = await apiClient.patch(`/checklists/${id}`, { title });
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/checklists/${id}`);
  },
  createItem: async (checklistId: string, content: string): Promise<ChecklistItem> => {
    const response = await apiClient.post(`/checklists/${checklistId}/items`, { content: content });
    return response.data.data;
  },
  updateItem: async (itemId: string, payload: { isDone?: boolean; content?: string }): Promise<ChecklistItem> => {
    const response = await apiClient.patch(`/checklists/items/${itemId}`, payload);
    return response.data.data;
  },
  deleteItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/checklists/items/${itemId}`);
  },
};

// ── Query keys ────────────────────────────────────────────────────────

export const checklistKeys = {
  all: ['checklists'] as const,
  byCard: (cardId: string) => [...checklistKeys.all, cardId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────

export function useChecklists(cardId: string | undefined) {
  return useQuery({
    queryKey: checklistKeys.byCard(cardId ?? ''),
    queryFn: () => checklistsApi.getByCard(cardId ?? ''),
    enabled: !!cardId,
  });
}

export function useAddChecklistMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (title: string) => checklistsApi.create(cardId ?? '', title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateChecklistMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: ({ checklistId, title }: { checklistId: string; title: string }) =>
      checklistsApi.update(checklistId, title),
    onMutate: async ({ checklistId, title }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);

      queryClient.setQueryData<Checklist[]>(key, (old) =>
        (old ?? []).map((checklist) =>
          checklist.id === checklistId
            ? { ...checklist, title }
            : checklist,
        ),
      );

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useAddChecklistItemMutation(
  cardId: string | undefined,
  checklistId: string
) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (content: string) => checklistsApi.createItem(checklistId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateItemMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: ({ itemId, isDone, content }: { itemId: string; isDone?: boolean; content?: string }) =>
      checklistsApi.updateItem(itemId, { isDone, content }),
    onMutate: async ({ itemId, isDone, content }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);
      queryClient.setQueryData<Checklist[]>(key, (old) =>
        (old ?? []).map((c) => ({
          ...c,
          items: c.items.map((i) =>
            i.id === itemId ? { ...i, ...(isDone !== undefined ? { isDone } : {}), ...(content !== undefined ? { content } : {}) } : i
          ),
        }))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteChecklistMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (checklistId: string) => checklistsApi.delete(checklistId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteItemMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (itemId: string) => checklistsApi.deleteItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
