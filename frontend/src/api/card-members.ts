import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';
import type { BoardCard } from '@/components/board/types';
import { api } from '@/services/api';

// ── API calls ────────────────────────────────────────────────────────

async function assignMemberApi(params: { cardId: string; userId: string }): Promise<void> {
  await api.post(`/cards/${params.cardId}/members`, { userId: params.userId });
}

async function unassignMemberApi(params: { cardId: string; userId: string }): Promise<void> {
  await api.delete(`/cards/${params.cardId}/members/${params.userId}`);
}

// ── Cache helpers ────────────────────────────────────────────────────

type Snapshot = [readonly unknown[], unknown][];

function snapshotCardCaches(queryClient: ReturnType<typeof useQueryClient>): Snapshot {
  return queryClient.getQueriesData({ queryKey: ['cards'] });
}

function restoreSnapshot(queryClient: ReturnType<typeof useQueryClient>, snapshot: Snapshot) {
  for (const [key, value] of snapshot) {
    queryClient.setQueryData(key, value);
  }
}

function updateCardInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  cardId: string,
  updater: (card: BoardCard) => BoardCard
) {
  const directCard = queryClient.getQueryData<BoardCard>(['cards', cardId]);
  if (directCard) {
    queryClient.setQueryData(['cards', cardId], updater(directCard));
  }
}

// ── Mutations ────────────────────────────────────────────────────────

export function useAssignMember(cardId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignMemberApi,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: ['cards', cardId] });

      const snapshot = snapshotCardCaches(queryClient);

      // Resolve full user object from board members cache
      const boardMembers =
        queryClient.getQueryData<User[]>(['boards', boardId, 'members']) ?? [];
      const userToAdd: User = boardMembers.find((u) => u.id === userId) ?? {
        id: userId,
        name: 'User',
        email: '',
      };

      updateCardInCache(queryClient, cardId, (card) => {
        const currentMembers = card.members ?? [];
        const alreadyAssigned = currentMembers.some((m) => m.id === userId);
        if (alreadyAssigned) return card;
        return { ...card, members: [...currentMembers, userToAdd] };
      });

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) restoreSnapshot(queryClient, ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
    },
  });
}

export function useUnassignMember(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unassignMemberApi,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: ['cards', cardId] });

      const snapshot = snapshotCardCaches(queryClient);

      updateCardInCache(queryClient, cardId, (card) => ({
        ...card,
        members: (card.members ?? []).filter((m) => m.id !== userId),
      }));

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) restoreSnapshot(queryClient, ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
    },
  });
}
