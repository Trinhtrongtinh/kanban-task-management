'use client';

import {
  type DragEndEvent,
  type DragOverEvent,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  closestCorners,
} from '@dnd-kit/core';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BoardCard, BoardList } from './types';
import { BoardStatic } from './board-static';
import { LIST_QUERY_KEYS, useListsByBoard, useUpdateList } from '@/hooks/data/use-lists';
import { useMoveCard } from '@/hooks/data/use-cards';
import { useSocket } from '@/hooks/ui/useSocket';

interface BoardContextValue {
  boardId: string;
  boardBackgroundUrl?: string | null;
  lists: BoardList[];
  setLists: React.Dispatch<React.SetStateAction<BoardList[]>>;
}

type DroppableData = { type: 'Card'; listId: string; card: BoardCard } | { type: 'List'; listId: string };

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  if (from === to) return array;
  const result = [...array];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

function getTargetListId(over: { data?: { current?: unknown } } | null): string | null {
  const data = over?.data?.current as DroppableData | undefined;
  if (!data || !('listId' in data)) return null;
  return data.listId;
}

const BoardContext = createContext<BoardContextValue | null>(null);

interface BoardProviderProps {
  boardId: string;
  boardBackgroundUrl?: string | null;
  children: React.ReactNode;
}

export function BoardProvider({ boardId, boardBackgroundUrl, children }: BoardProviderProps) {
  const queryClient = useQueryClient();
  const { data: fetchedLists, isLoading } = useListsByBoard(boardId);
  const [lists, setLists] = useState<BoardList[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const updateList = useUpdateList();
  const moveCard = useMoveCard();
  const { on } = useSocket(boardId, '/cards');

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (fetchedLists) {
      const mappedLists = fetchedLists.map(list => ({
        ...list,
        cards: (list.cards || []).map((card: BoardCard) => ({
          ...card,
          // Normalize: convert single `assignee` to `members` array
          members: card.members?.length
            ? card.members
            : card.assignee
              ? [card.assignee]
              : [],
        })),
      }));
      queueMicrotask(() => {
        setLists(mappedLists as BoardList[]);
      });
    }
  }, [fetchedLists]);

  useEffect(() => {
    const refetchBoardLists = () => {
      queryClient.invalidateQueries({
        queryKey: LIST_QUERY_KEYS.byBoard(boardId),
        refetchType: 'active',
      });
    };

    const unsubscribers = [
      on('list:created', refetchBoardLists),
      on('list:updated', refetchBoardLists),
      on('list:deleted', refetchBoardLists),
      on('card:created', refetchBoardLists),
      on('card:updated', refetchBoardLists),
      on('card:deleted', refetchBoardLists),
      on('card:moved', refetchBoardLists),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [boardId, on, queryClient]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!active || !over) return;
    if (active.id === over.id) return;

    const activeData = active.data?.current as DroppableData | undefined;
    // Chỉ xử lý khi đang kéo Card
    if (activeData?.type !== 'Card') return;

    const targetListId = getTargetListId(over);
    if (!targetListId) return;

    const cardId = active.id as string;

    setLists((prevLists) => {
      // Tìm list hiện chứa thẻ (có thể đã chuyển trong onDragOver trước đó)
      const sourceList = prevLists.find((l) => l.cards.some((c) => c.id === cardId));
      if (!sourceList) return prevLists;

      const sourceListId = sourceList.id;
      const overData = over.data?.current as DroppableData | undefined;

      // Reorder mượt khi kéo trong cùng list
      if (sourceListId === targetListId) {
        if (overData?.type !== 'Card') {
          return prevLists;
        }

        const oldIndex = sourceList.cards.findIndex((c) => c.id === cardId);
        const newIndex = sourceList.cards.findIndex((c) => c.id === over.id);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return prevLists;
        }

        const reordered = arrayMove(sourceList.cards, oldIndex, newIndex);
        return prevLists.map((list) =>
          list.id === sourceListId ? { ...list, cards: reordered } : list,
        );
      }

      const targetList = prevLists.find((l) => l.id === targetListId);
      if (!targetList) return prevLists;

      const cardIndex = sourceList.cards.findIndex((c) => c.id === cardId);
      if (cardIndex < 0) return prevLists;

      const movedCard = sourceList.cards[cardIndex];
      const newSourceCards = sourceList.cards.filter((_, i) => i !== cardIndex);

      // Xác định vị trí chèn vào target list
      let insertIndex = targetList.cards.length;
      if (overData?.type === 'Card') {
        const overCardId = over.id as string;
        const idx = targetList.cards.findIndex((c) => c.id === overCardId);
        if (idx >= 0) insertIndex = idx;
      }

      const newTargetCards = [...targetList.cards];
      newTargetCards.splice(insertIndex, 0, movedCard);

      return prevLists.map((list) => {
        if (list.id === sourceListId) return { ...list, cards: newSourceCards };
        if (list.id === targetListId) return { ...list, cards: newTargetCards };
        return list;
      });
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data?.current as DroppableData | undefined;
    const overData = over.data?.current as DroppableData | undefined;

    // Kéo List (sắp xếp cột)
    if (activeData?.type === 'List') {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        const reordered = arrayMove(lists, oldIndex, newIndex);

        // Compute new position
        let newPosition = 65535; // Default POSITION_GAP
        if (reordered.length <= 1) {
          newPosition = 65535;
        } else if (newIndex === 0) {
          newPosition = reordered[1].position / 2;
        } else if (newIndex === reordered.length - 1) {
          newPosition = reordered[reordered.length - 2].position + 65535;
        } else {
          newPosition = (reordered[newIndex - 1].position + reordered[newIndex + 1].position) / 2;
        }

        newPosition = Math.round(newPosition);

        // Call API to persist new ordering
        updateList.mutate({
          id: active.id as string,
          payload: { position: newPosition },
          boardId
        });

        // Optimistically update the list's local position
        reordered[newIndex] = { ...reordered[newIndex], position: newPosition };
        setLists(reordered);
      }
      return;
    }

    // Kéo Card
    if (activeData?.type === 'Card') {
      const cardId = active.id as string;
      setLists((prev) => {
        const currentList = prev.find((l) => l.cards.some((c) => c.id === cardId));
        if (!currentList) {
          return prev;
        }

        const sourceListId = currentList.id;
        const targetListId = overData?.listId ?? sourceListId;
        const targetList = prev.find((l) => l.id === targetListId);
        if (!targetList) {
          return prev;
        }

        if (sourceListId === targetListId) {
          const oldIndex = currentList.cards.findIndex((c) => c.id === cardId);
          if (oldIndex < 0) {
            return prev;
          }

          let newIndex = oldIndex;
          if (overData?.type === 'Card') {
            const idx = currentList.cards.findIndex((c) => c.id === over.id);
            if (idx >= 0) {
              newIndex = idx;
            }
          }

          const newCards =
            oldIndex !== newIndex
              ? arrayMove(currentList.cards, oldIndex, newIndex)
              : currentList.cards;

          const finalIndex = newCards.findIndex((c) => c.id === cardId);
          const prevCardId = finalIndex > 0 ? newCards[finalIndex - 1].id : undefined;
          const nextCardId =
            finalIndex >= 0 && finalIndex < newCards.length - 1
              ? newCards[finalIndex + 1].id
              : undefined;

          moveCard.mutate({
            id: cardId,
            payload: {
              targetListId,
              prevCardId,
              nextCardId,
            },
          });

          return prev.map((list) =>
            list.id === sourceListId ? { ...list, cards: newCards } : list,
          );
        }

        const sourceIndex = currentList.cards.findIndex((c) => c.id === cardId);
        if (sourceIndex < 0) {
          return prev;
        }

        const movedCard = currentList.cards[sourceIndex];
        const newSourceCards = currentList.cards.filter((_, i) => i !== sourceIndex);

        let insertIndex = targetList.cards.length;
        if (overData?.type === 'Card') {
          const idx = targetList.cards.findIndex((c) => c.id === over.id);
          if (idx >= 0) {
            insertIndex = idx;
          }
        }

        const newTargetCards = [...targetList.cards];
        newTargetCards.splice(insertIndex, 0, movedCard);

        const finalIndex = newTargetCards.findIndex((c) => c.id === cardId);
        const prevCardId = finalIndex > 0 ? newTargetCards[finalIndex - 1].id : undefined;
        const nextCardId =
          finalIndex >= 0 && finalIndex < newTargetCards.length - 1
            ? newTargetCards[finalIndex + 1].id
            : undefined;

        moveCard.mutate({
          id: cardId,
          payload: {
            targetListId,
            prevCardId,
            nextCardId,
          },
        });

        return prev.map((list) => {
          if (list.id === sourceListId) return { ...list, cards: newSourceCards };
          if (list.id === targetListId) return { ...list, cards: newTargetCards };
          return list;
        });
      });
    }
  }, [boardId, lists, moveCard, updateList]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const value: BoardContextValue = {
    boardId,
    boardBackgroundUrl,
    lists,
    setLists,
  };

  return (
    <BoardContext.Provider value={value}>
      {!isMounted || isLoading ? (
        React.isValidElement(children) ? (
          React.cloneElement(children, {}, <BoardStatic lists={lists} boardBackgroundUrl={boardBackgroundUrl} />)
        ) : (
          <BoardStatic lists={lists} boardBackgroundUrl={boardBackgroundUrl} />
        )
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {children}
        </DndContext>
      )}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error('useBoard must be used within BoardProvider');
  }
  return ctx;
}

/** Safe version — returns null when outside BoardProvider (e.g. in global modals) */
export function useBoardSafe(): BoardContextValue | null {
  return useContext(BoardContext);
}
