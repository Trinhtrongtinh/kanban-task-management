'use client';

import { useState } from 'react';
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
  useUpdateItemMutation,
  useDeleteChecklistMutation,
  useDeleteItemMutation,
} from '@/api/checklists';
import { CheckSquare, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { ChecklistItemComponent } from './checklist-item';
import type { Checklist } from '@/types';

interface ChecklistProps {
  checklist: Checklist;
  cardId: string;
}

export function ChecklistComponent({ checklist, cardId }: ChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [open, setOpen] = useState(false);
  const addItem = useAddChecklistItemMutation(cardId, checklist.id);
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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">{checklist.title}</span>
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
          <div className="space-y-0 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {checklist.items.map((item) => (
              <ChecklistItemComponent
                key={item.id}
                item={item}
                onUpdate={updateItem.mutate}
                onDelete={deleteItem.mutate}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Add an item"
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
