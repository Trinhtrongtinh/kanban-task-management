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
import type { BoardCard, BoardList } from './types';
import { BoardStatic } from './board-static';
import { useListsByBoard, useUpdateList } from '@/hooks/use-lists';
import { useMoveCard } from '@/hooks/use-cards';
import { Loader2 } from 'lucide-react';

interface BoardContextValue {
  boardId: string;
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
  children: React.ReactNode;
}

export function BoardProvider({ boardId, children }: BoardProviderProps) {
  const { data: fetchedLists, isLoading } = useListsByBoard(boardId);
  const [lists, setLists] = useState<BoardList[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const updateList = useUpdateList();
  const moveCard = useMoveCard();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (fetchedLists) {
      const mappedLists = fetchedLists.map(list => ({
        ...list,
        cards: (list.cards || []).map((card: any) => ({
          ...card,
          // Normalize: convert single `assignee` to `members` array
          members: card.members?.length
            ? card.members
            : card.assignee
              ? [card.assignee]
              : [],
        })),
      }));
      setLists(mappedLists as BoardList[]);
    }
  }, [fetchedLists]);

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
      // Không làm gì nếu thẻ vẫn thuộc cùng một list (tránh setState liên tục)
      if (sourceListId === targetListId) return prevLists;

      const targetList = prevLists.find((l) => l.id === targetListId);
      if (!targetList) return prevLists;

      const cardIndex = sourceList.cards.findIndex((c) => c.id === cardId);
      if (cardIndex < 0) return prevLists;

      const movedCard = sourceList.cards[cardIndex];
      const newSourceCards = sourceList.cards.filter((_, i) => i !== cardIndex);

      // Xác định vị trí chèn vào target list
      let insertIndex = targetList.cards.length;
      const overData = over.data?.current as DroppableData | undefined;
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
      const sourceListId = activeData.listId;
      const targetListId = overData?.listId ?? sourceListId;

      if (sourceListId === targetListId) {
        // Sắp xếp trong cùng cột
        setLists((prev) =>
          prev.map((list) => {
            if (list.id !== sourceListId) return list;
            const oldIndex = list.cards.findIndex((c) => c.id === cardId);
            const newIndex = list.cards.findIndex((c) => c.id === over.id);
            if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
              const newCards = arrayMove(list.cards, oldIndex, newIndex);
              const prevCardId = newIndex > 0 ? newCards[newIndex - 1].id : undefined;
              const nextCardId = newIndex < newCards.length - 1 ? newCards[newIndex + 1].id : undefined;

              moveCard.mutate({
                id: cardId,
                payload: {
                  targetListId,
                  prevCardId,
                  nextCardId,
                },
              });

              return { ...list, cards: newCards };
            }
            return list;
          })
        );
      }
      // Cross-list: state đã được cập nhật trong onDragOver, đảm bảo vị trí cuối
      else {
        setLists((prev) => {
          const sourceList = prev.find((l) => l.id === sourceListId);
          const targetList = prev.find((l) => l.id === targetListId);
          if (!sourceList || !targetList) return prev;

          const cardIndex = sourceList.cards.findIndex((c) => c.id === cardId);
          if (cardIndex < 0) return prev; // Đã chuyển trong onDragOver

          const movedCard = sourceList.cards[cardIndex];
          const newSourceCards = sourceList.cards.filter((_, i) => i !== cardIndex);

          let insertIndex = targetList.cards.length;
          if (overData?.type === 'Card') {
            const idx = targetList.cards.findIndex((c) => c.id === over.id);
            if (idx >= 0) insertIndex = idx;
          }

          const newTargetCards = [...targetList.cards];
          newTargetCards.splice(insertIndex, 0, movedCard);

          const prevCardId = insertIndex > 0 ? newTargetCards[insertIndex - 1].id : undefined;
          const nextCardId = insertIndex < newTargetCards.length - 1 ? newTargetCards[insertIndex + 1].id : undefined;

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
    }
  }, [lists]);

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
    lists,
    setLists,
  };

  return (
    <BoardContext.Provider value={value}>
      {!isMounted || isLoading ? (
        React.isValidElement(children) ? (
          React.cloneElement(children, {}, <BoardStatic lists={lists} />)
        ) : (
          <BoardStatic lists={lists} />
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
