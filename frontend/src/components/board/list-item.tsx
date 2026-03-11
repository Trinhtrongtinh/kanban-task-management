'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { BoardList } from './types';
import { CardItem } from './card-item';
import { CardForm } from './card-form';
import { ListHeader } from './list-header';
import { cn } from '@/lib/utils';

interface ListItemProps {
  list: BoardList;
}

export function ListItem({ list }: ListItemProps) {
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'List',
      listId: list.id,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${list.id}`,
    data: {
      type: 'List',
      listId: list.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardIds = useMemo(() => list.cards.map((card) => card.id), [list.cards]);
  const highlightedListId = searchParams.get('listId');
  const isHighlighted = highlightedListId === list.id;

  useEffect(() => {
    if (!isHighlighted) return;

    rootRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [isHighlighted]);

  const handleSetNodeRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    rootRef.current = node;
  };

  return (
    <div
      ref={handleSetNodeRef}
      style={style}
      className={cn(
        'flex h-fit max-h-full w-[272px] shrink-0 flex-col rounded-xl bg-[#f1f2f4] p-3',
        isDragging && 'opacity-50',
        isHighlighted && 'ring-2 ring-primary shadow-lg shadow-primary/15'
      )}
    >
      {/* Header — drag handle is now inside ListHeader as a grip icon */}
      <ListHeader
        list={list}
        dragListeners={listeners}
        dragAttributes={attributes}
      />

      {/* Cards - scrollable, droppable area */}
      <div
        ref={setDropRef}
        className={cn(
          'flex min-h-[60px] flex-1 flex-col space-y-2 overflow-y-auto rounded-lg transition-colors',
          isOver && 'bg-black/5'
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <CardItem key={card.id} card={card} listId={list.id} />
          ))}
        </SortableContext>
      </div>

      {/* Quick-add card form */}
      <CardForm listId={list.id} />
    </div>
  );
}

