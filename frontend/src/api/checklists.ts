import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Checklist, ChecklistItem } from '@/types';

// ── In-memory mock store ──────────────────────────────────────────────

const MOCK_CHECKLISTS: Record<string, Checklist[]> = {};

function getChecklistsForCard(cardId: string): Checklist[] {
  return MOCK_CHECKLISTS[cardId] ?? [];
}

function setChecklistsForCard(cardId: string, checklists: Checklist[]) {
  MOCK_CHECKLISTS[cardId] = checklists;
}

// ── Mock API functions ────────────────────────────────────────────────

function addChecklist(cardId: string, title: string): Promise<Checklist> {
  const id = `cl-${Date.now()}`;
  const checklist: Checklist = { id, title, cardId, items: [] };
  const lists = getChecklistsForCard(cardId);
  setChecklistsForCard(cardId, [...lists, checklist]);
  return Promise.resolve(checklist);
}

function addChecklistItem(
  checklistId: string,
  title: string
): Promise<ChecklistItem> {
  const id = `ci-${Date.now()}`;
  const item: ChecklistItem = { id, title, isCompleted: false, checklistId };
  const cardId = Object.keys(MOCK_CHECKLISTS).find((cid) =>
    MOCK_CHECKLISTS[cid].some((c) => c.id === checklistId)
  );
  if (!cardId) return Promise.reject(new Error('Checklist not found'));
  const lists = getChecklistsForCard(cardId).map((c) =>
    c.id === checklistId ? { ...c, items: [...c.items, item] } : c
  );
  setChecklistsForCard(cardId, lists);
  return Promise.resolve(item);
}

function toggleItemState(itemId: string): Promise<ChecklistItem> {
  for (const lists of Object.values(MOCK_CHECKLISTS)) {
    for (const checklist of lists) {
      const item = checklist.items.find((i) => i.id === itemId);
      if (item) {
        const updated = { ...item, isCompleted: !item.isCompleted };
        const newItems = checklist.items.map((i) =>
          i.id === itemId ? updated : i
        );
        const cardId = checklist.cardId;
        const newLists = getChecklistsForCard(cardId).map((c) =>
          c.id === checklist.id ? { ...c, items: newItems } : c
        );
        setChecklistsForCard(cardId, newLists);
        return Promise.resolve(updated);
      }
    }
  }
  return Promise.reject(new Error('Item not found'));
}

function deleteChecklist(checklistId: string): Promise<void> {
  const cardId = Object.keys(MOCK_CHECKLISTS).find((cid) =>
    MOCK_CHECKLISTS[cid].some((c) => c.id === checklistId)
  );
  if (!cardId) return Promise.reject(new Error('Checklist not found'));
  const lists = getChecklistsForCard(cardId).filter(
    (c) => c.id !== checklistId
  );
  setChecklistsForCard(cardId, lists);
  return Promise.resolve();
}

function deleteItem(itemId: string): Promise<void> {
  for (const lists of Object.values(MOCK_CHECKLISTS)) {
    for (const checklist of lists) {
      const item = checklist.items.find((i) => i.id === itemId);
      if (item) {
        const newItems = checklist.items.filter((i) => i.id !== itemId);
        const cardId = checklist.cardId;
        const newLists = getChecklistsForCard(cardId).map((c) =>
          c.id === checklist.id ? { ...c, items: newItems } : c
        );
        setChecklistsForCard(cardId, newLists);
        return Promise.resolve();
      }
    }
  }
  return Promise.reject(new Error('Item not found'));
}

// ── Query keys ────────────────────────────────────────────────────────

const checklistKeys = {
  all: ['checklists'] as const,
  byCard: (cardId: string) => [...checklistKeys.all, cardId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────

export function useChecklists(cardId: string | undefined) {
  return useQuery({
    queryKey: checklistKeys.byCard(cardId ?? ''),
    queryFn: () => getChecklistsForCard(cardId ?? ''),
    enabled: !!cardId,
  });
}

/** Optimistic: instantly appends a new checklist */
export function useAddChecklistMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (title: string) => addChecklist(cardId ?? '', title),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);
      const optimistic: Checklist = {
        id: `cl-opt-${Date.now()}`,
        title,
        cardId: cardId ?? '',
        items: [],
      };
      queryClient.setQueryData<Checklist[]>(key, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev };
    },
    onError: (_err, _title, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Optimistic: instantly appends a new item */
export function useAddChecklistItemMutation(
  cardId: string | undefined,
  checklistId: string
) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (title: string) => addChecklistItem(checklistId, title),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);
      const optimisticItem: ChecklistItem = {
        id: `ci-opt-${Date.now()}`,
        title,
        isCompleted: false,
        checklistId,
      };
      queryClient.setQueryData<Checklist[]>(key, (old) =>
        (old ?? []).map((c) =>
          c.id === checklistId
            ? { ...c, items: [...c.items, optimisticItem] }
            : c
        )
      );
      return { prev };
    },
    onError: (_err, _title, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Optimistic toggle — instant strikethrough + progress update */
export function useToggleItemStateMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (itemId: string) => toggleItemState(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);
      queryClient.setQueryData<Checklist[]>(key, (old) =>
        (old ?? []).map((c) => ({
          ...c,
          items: c.items.map((i) =>
            i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
          ),
        }))
      );
      return { prev };
    },
    onError: (_err, _itemId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Optimistic delete checklist */
export function useDeleteChecklistMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (checklistId: string) => deleteChecklist(checklistId),
    onMutate: async (checklistId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);
      queryClient.setQueryData<Checklist[]>(key, (old) =>
        (old ?? []).filter((c) => c.id !== checklistId)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Optimistic delete item */
export function useDeleteItemMutation(cardId: string | undefined) {
  const queryClient = useQueryClient();
  const key = checklistKeys.byCard(cardId ?? '');

  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Checklist[]>(key);
      queryClient.setQueryData<Checklist[]>(key, (old) =>
        (old ?? []).map((c) => ({
          ...c,
          items: c.items.filter((i) => i.id !== itemId),
        }))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
