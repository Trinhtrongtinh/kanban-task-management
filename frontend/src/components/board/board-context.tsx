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

const MOCK_LISTS: BoardList[] = [
  {
    id: 'list-1',
    title: 'To Do',
    boardId: 'board-1',
    order: 0,
    cards: [
      { 
        id: 'card-1', 
        title: 'Task 1', 
        boardId: '', 
        members: [], 
        dueDate: '2026-03-08T10:00:00Z',
        attachments: [
          {
            id: 'att-1',
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
            fileName: 'design-mockup.png',
            type: 'image/png',
            createdAt: '2026-03-09T10:00:00Z'
          },
          {
            id: 'att-2',
            url: '#',
            fileName: 'requirements.pdf',
            type: 'application/pdf',
            createdAt: '2026-03-09T11:30:00Z'
          }
        ]
      },
      { id: 'card-2', title: 'Task 2', boardId: '', members: [], dueDate: '2026-03-10T08:00:00Z' },
      { id: 'card-3', title: 'Task 3', boardId: '', members: [] },
    ],
  },
  {
    id: 'list-2',
    title: 'In Progress',
    boardId: 'board-1',
    order: 1,
    cards: [
      { id: 'card-4', title: 'Task 4', boardId: '', members: [], dueDate: '2026-03-15T14:00:00Z' },
      { id: 'card-5', title: 'Task 5', boardId: '', members: [] },
    ],
  },
  {
    id: 'list-3',
    title: 'Done',
    boardId: 'board-1',
    order: 2,
    cards: [
      { id: 'card-6', title: 'Task 6', boardId: '', members: [], dueDate: '2026-03-07T12:00:00Z', isCompleted: true },
    ],
  },
];

interface BoardProviderProps {
  boardId: string;
  children: React.ReactNode;
}

export function BoardProvider({ boardId, children }: BoardProviderProps) {
  const [lists, setLists] = useState<BoardList[]>(MOCK_LISTS);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        setLists((prev) => arrayMove(prev, oldIndex, newIndex));
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
              return { ...list, cards: arrayMove(list.cards, oldIndex, newIndex) };
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
      {!isMounted ? (
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
