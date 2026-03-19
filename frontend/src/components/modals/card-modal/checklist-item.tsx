'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { ChecklistItem } from '@/types';
import { useI18n } from '@/hooks/ui/use-i18n';

interface ChecklistItemProps {
  item: ChecklistItem;
  onUpdate: (params: { itemId: string; isDone?: boolean; content?: string }) => void;
  onDelete: (id: string) => void;
}

export function ChecklistItemComponent({
  item,
  onUpdate,
  onDelete,
}: ChecklistItemProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);

  const handleSave = () => {
    if (content.trim() !== item.content && content.trim() !== '') {
      onUpdate({ itemId: item.id, content: content.trim() });
    } else {
      setContent(item.content);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setContent(item.content);
      setIsEditing(false);
    }
  };

  return (
    <div className="group flex min-w-0 flex-row items-center gap-2 py-1.5 min-h-[32px]">
      <Checkbox
        checked={item.isDone}
        onCheckedChange={() => onUpdate({ itemId: item.id, isDone: !item.isDone })}
        className="mt-0.5"
      />
      {isEditing ? (
        <Input
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-7 min-w-0 flex-1 text-sm"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`min-w-0 flex-1 text-sm cursor-text break-words ${item.isDone ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}
        >
          {item.content || t('cardModal.checklists.untitledItem')}
        </span>
      )}
      {!isEditing && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onDelete(item.id)}
          aria-label={t('cardModal.attachments.delete')}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
