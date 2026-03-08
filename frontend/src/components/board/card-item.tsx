'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCardModal } from '@/hooks/use-card-modal';
import type { BoardCard } from './types';
import { cn } from '@/lib/utils';

interface CardItemProps {
  card: BoardCard;
  listId: string;
}

export function CardItem({ card, listId }: CardItemProps) {
  const onOpen = useCardModal((s) => s.onOpen);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      listId,
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card.id)}
      className={cn(
        'cursor-grab rounded-md border border-transparent bg-white px-3 py-2 shadow-sm transition-colors hover:border-border active:cursor-grabbing',
        isDragging && 'opacity-40 shadow-md'
      )}
    >
      <span className="text-sm text-foreground">{card.title}</span>
    </div>
  );
}
