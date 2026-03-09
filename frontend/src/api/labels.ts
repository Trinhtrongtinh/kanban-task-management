import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Label } from '@/components/board/types';
import { useBoardSafe } from '@/components/board/board-context';

// ── In-memory mock store ──────────────────────────────────────────────

const MOCK_LABELS: Label[] = [
  { id: 'label-1', boardId: 'board-1', title: 'Feature', color: '#16a34a' },
  { id: 'label-2', boardId: 'board-1', title: 'Bug', color: '#dc2626' },
  { id: 'label-3', boardId: 'board-1', title: 'Design', color: '#8b5cf6' },
  { id: 'label-4', boardId: 'board-1', title: 'Urgent', color: '#ea580c' },
];

let labelsStore = [...MOCK_LABELS];

function getBoardLabels(boardId: string): Promise<Label[]> {
  return Promise.resolve(labelsStore.filter((l) => l.boardId === boardId));
}

function createLabel(boardId: string, title: string, color: string): Promise<Label> {
  const newLabel: Label = { id: `label-${Date.now()}`, boardId, title, color };
  labelsStore = [...labelsStore, newLabel];
  return Promise.resolve(newLabel);
}

// ── Query keys ────────────────────────────────────────────────────────

export const labelKeys = {
  all: ['labels'] as const,
  byBoard: (boardId: string) => [...labelKeys.all, boardId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────

export function useBoardLabels(boardId: string) {
  return useQuery({
    queryKey: labelKeys.byBoard(boardId),
    queryFn: () => getBoardLabels(boardId),
    enabled: !!boardId,
  });
}

export function useCreateLabel(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, color }: { title: string; color: string }) =>
      createLabel(boardId, title, color),
    onMutate: async (newLabelReq) => {
      await queryClient.cancelQueries({ queryKey: labelKeys.byBoard(boardId) });

      const previousLabels = queryClient.getQueryData<Label[]>(labelKeys.byBoard(boardId));

      const optimisticLabel: Label = {
        id: `label-opt-${Date.now()}`,
        boardId,
        title: newLabelReq.title,
        color: newLabelReq.color,
      };

      queryClient.setQueryData<Label[]>(labelKeys.byBoard(boardId), (old) => [
        ...(old || []),
        optimisticLabel,
      ]);

      return { previousLabels };
    },
    onError: (err, newLabelReq, context) => {
      if (context?.previousLabels) {
        queryClient.setQueryData(labelKeys.byBoard(boardId), context.previousLabels);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.byBoard(boardId) });
    },
  });
}

/** Optimistic toggle tag logic on card array object inside `BoardContext` */
export function useToggleCardLabel() {
  const boardCtx = useBoardSafe();

  return useMutation({
    mutationFn: async ({ cardId, label }: { cardId: string; label: Label }) => {
      // Mock network delay
      return { cardId, label };
    },
    onMutate: async ({ cardId, label }) => {
      if (!boardCtx) return;
      const { lists, setLists } = boardCtx;
      const prevLists = lists;

      const newLists = lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => {
          if (card.id === cardId) {
            const hasLabel = card.labels?.some((l) => l.id === label.id);
            const newLabels = hasLabel
              ? (card.labels || []).filter((l) => l.id !== label.id)
              : [...(card.labels || []), label];
            return { ...card, labels: newLabels };
          }
          return card;
        }),
      }));

      setLists(newLists);

      return { prevLists };
    },
    onError: (error, variables, context) => {
      if (boardCtx && context?.prevLists) {
        boardCtx.setLists(context.prevLists);
      }
    },
  });
}
