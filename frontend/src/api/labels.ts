import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Label } from '@/components/board/types';
import { useBoardSafe } from '@/components/board/board-context';
import { apiClient } from './client';
import { QUERY_STALE_TIME } from '@/lib/cache-ttl';

export const labelsApi = {
  getBoardLabels: async (boardId: string): Promise<Label[]> => {
    const response = await apiClient.get(`/labels/board/${boardId}`);
    return response.data.data;
  },
  createLabel: async (boardId: string, name: string, colorCode: string): Promise<Label> => {
    const response = await apiClient.post('/labels', { boardId, name, colorCode });
    return response.data.data;
  },
  addLabelToCard: async (cardId: string, labelId: string): Promise<void> => {
    await apiClient.post(`/cards/${cardId}/labels/${labelId}`);
  },
  removeLabelFromCard: async (cardId: string, labelId: string): Promise<void> => {
    await apiClient.delete(`/cards/${cardId}/labels/${labelId}`);
  },
};

export const labelKeys = {
  all: ['labels'] as const,
  byBoard: (boardId: string) => [...labelKeys.all, boardId] as const,
};

export function useBoardLabels(boardId: string | undefined) {
  return useQuery({
    queryKey: labelKeys.byBoard(boardId ?? ''),
    queryFn: () => labelsApi.getBoardLabels(boardId ?? ''),
    enabled: !!boardId,
    staleTime: QUERY_STALE_TIME.LABELS_BY_BOARD_MS,
  });
}

export function useCreateLabel(boardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, colorCode }: { name: string; colorCode: string }) =>
      labelsApi.createLabel(boardId ?? '', name, colorCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.byBoard(boardId ?? '') });
    },
  });
}

export function useToggleCardLabel() {
  const boardCtx = useBoardSafe();

  return useMutation({
    mutationFn: async ({ cardId, label, action }: { cardId: string; label: Label; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        await labelsApi.addLabelToCard(cardId, label.id);
      } else {
        await labelsApi.removeLabelFromCard(cardId, label.id);
      }
      return { cardId, label, action };
    },
    onMutate: async ({ cardId, label, action }) => {
      if (!boardCtx) return;
      const { lists, setLists } = boardCtx;
      const prevLists = lists;

      const newLists = lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => {
          if (card.id === cardId) {
            const hasLabel = card.labels?.some((l) => l.id === label.id);
            if (action === 'add' && !hasLabel) {
              return { ...card, labels: [...(card.labels || []), label] };
            } else if (action === 'remove' && hasLabel) {
              return { ...card, labels: (card.labels || []).filter((l) => l.id !== label.id) };
            }
          }
          return card;
        }),
      }));

      setLists(newLists);
      return { prevLists };
    },
    onError: (_error, _variables, context) => {
      if (boardCtx && context?.prevLists) {
        boardCtx.setLists(context.prevLists);
      }
    },
  });
}
