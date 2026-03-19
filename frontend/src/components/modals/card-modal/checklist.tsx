'use client';

import { useEffect, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  useAddChecklistItemMutation,
  useUpdateChecklistMutation,
  useUpdateItemMutation,
  useDeleteChecklistMutation,
  useDeleteItemMutation,
} from '@/api/checklists';
import { CheckSquare, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { ChecklistItemComponent } from './checklist-item';
import type { Checklist } from '@/types';
import { useI18n } from '@/hooks/ui/use-i18n';

interface ChecklistProps {
  checklist: Checklist;
  cardId: string;
}

export function ChecklistComponent({ checklist, cardId }: ChecklistProps) {
  const { t } = useI18n();
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(checklist.title);
  const [open, setOpen] = useState(false);
  const addItem = useAddChecklistItemMutation(cardId, checklist.id);
  const updateChecklist = useUpdateChecklistMutation(cardId);
  const updateItem = useUpdateItemMutation(cardId);
  const deleteChecklist = useDeleteChecklistMutation(cardId);
  const deleteItem = useDeleteItemMutation(cardId);

  const completed = checklist.items.filter((i) => i.isDone).length;
  const total = checklist.items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAddItem = () => {
    const title = newItemTitle.trim();
    if (!title) return;
    addItem.mutate(title);
    setNewItemTitle('');
  };

  useEffect(() => {
    setTitleValue(checklist.title);
  }, [checklist.title]);

  const handleSaveTitle = () => {
    const nextTitle = titleValue.trim();
    if (!nextTitle) {
      setTitleValue(checklist.title);
      setIsEditingTitle(false);
      return;
    }

    if (nextTitle !== checklist.title) {
      updateChecklist.mutate({ checklistId: checklist.id, title: nextTitle });
    }

    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setTitleValue(checklist.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="min-w-0 max-w-full rounded-lg border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              placeholder={t('cardModal.checklists.defaultTitle')}
              className="h-7 flex-1 text-sm font-medium"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex-1 truncate text-left text-sm font-medium hover:text-primary"
              title={t('cardModal.checklists.defaultTitle')}
            >
              {checklist.title}
            </button>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="h-6 w-6 shrink-0">
              {open ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => deleteChecklist.mutate(checklist.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Progress value={percentage} className="mb-4 h-2" />
        <CollapsibleContent>
          <div className="max-h-[200px] max-w-full space-y-0 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
            {checklist.items.map((item) => (
              <ChecklistItemComponent
                key={item.id}
                item={item}
                onUpdate={updateItem.mutate}
                onDelete={deleteItem.mutate}
              />
            ))}
          </div>
          <div className="mt-2 flex min-w-0 gap-2">
            <Input
              placeholder={t('cardModal.checklists.itemPlaceholder')}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              className="h-8 text-sm"
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-8 shrink-0"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
