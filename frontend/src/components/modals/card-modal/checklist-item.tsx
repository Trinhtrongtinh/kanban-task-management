'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ChecklistItem } from '@/types';

interface ChecklistItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChecklistItemComponent({
  item,
  onToggle,
  onDelete,
}: ChecklistItemProps) {
  return (
    <div className="group flex flex-row items-center gap-2 py-1.5">
      <Checkbox
        checked={item.isCompleted}
        onCheckedChange={() => onToggle(item.id)}
      />
      <span
        className={`flex-1 text-sm ${
          item.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
        }`}
      >
        {item.title}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
