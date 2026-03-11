'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';
import { useCardModal } from '@/hooks/use-card-modal';
import { useBoard } from './board-context';
import type { BoardCard } from './types';
import { cn } from '@/lib/utils';
import {
  getDueDateStatus,
  getDueDateColor,
  formatDueDateShort,
} from '@/lib/due-date-utils';

interface CardItemProps {
  card: BoardCard;
  listId: string;
}

export function CardItem({ card, listId }: CardItemProps) {
  const onOpen = useCardModal((s) => s.onOpen);
  const { boardId } = useBoard();
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

  const dueDateStatus = getDueDateStatus(card.deadline || undefined, false);
  const dueDateColor = getDueDateColor(dueDateStatus);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card.id, boardId)}
      className={cn(
        'cursor-grab rounded-md border border-transparent bg-white px-3 py-2 shadow-sm transition-colors hover:border-border active:cursor-grabbing',
        isDragging && 'opacity-40 shadow-md'
      )}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {card.labels.map(label => (
            <div
              key={label.id}
              className="h-2 w-10 rounded-full"
              style={{ backgroundColor: label.colorCode }}
              title={label.name}
            />
          ))}
        </div>
      )}

      <span className="text-sm text-foreground block">{card.title}</span>
      {card.deadline && (
        <div className="mt-1.5 flex items-center">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none border',
              dueDateColor
            )}
          >
            <Clock className="h-3 w-3" />
            {formatDueDateShort(card.deadline as string)}
          </span>
        </div>
      )}
    </div>
  );
}
