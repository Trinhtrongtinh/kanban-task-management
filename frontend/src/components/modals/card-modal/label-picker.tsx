'use client';

import { useState } from 'react';
import { useBoardLabels, useCreateLabel, useToggleCardLabel } from '@/api/labels';
import { useCardModal } from '@/hooks/ui/use-card-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tag, Check, Plus } from 'lucide-react';
import { useBoardSafe } from '@/components/board/board-context';
import type { Label, BoardList, BoardCard } from '@/components/board/types';

export function LabelPicker() {
  const cardId = useCardModal((state) => state.id);
  const boardCtx = useBoardSafe();
  const lists = boardCtx?.lists ?? [];

  const currentCard = lists
    .flatMap((l: BoardList) => l.cards)
    .find((c: BoardCard) => c.id === cardId);

  const cardLabels = currentCard?.labels || [];

  const boardId = boardCtx?.boardId;

  const { data: boardLabels = [] } = useBoardLabels(boardId);
  const toggleLabel = useToggleCardLabel();
  const createLabel = useCreateLabel(boardId);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#blue-500'); // Hex or tailwind class? The prompt asks for label.color property.

  // Suggested Trello-like colors
  const presetColors = [
    '#22c55e', '#facc15', '#f97316', '#ef4444',
    '#a855f7', '#3b82f6', '#06b6d4', '#10b981',
    '#f43f5e', '#64748b'
  ];

  const handleToggle = (label: Label) => {
    if (!cardId) return;
    const isAssigned = cardLabels.some((cl: Label) => cl.id === label.id);
    toggleLabel.mutate({ cardId, label, action: isAssigned ? 'remove' : 'add' });
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createLabel.mutate(
      { name: newTitle, colorCode: newColor.startsWith('#') ? newColor : presetColors[0] },
      {
        onSuccess: () => {
          setNewTitle('');
          setIsCreating(false);
        }
      }
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="w-full justify-start mt-2">
          <Tag className="mr-2 h-4 w-4" />
          Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 pt-3" side="bottom">
        <div className="text-sm font-medium text-center text-muted-foreground pb-2 border-b mb-3">
          Labels
        </div>

        {!isCreating ? (
          <div className="flex flex-col gap-y-2">
            {boardLabels.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {boardLabels.map((lbl: Label) => {
                  const isAssigned = cardLabels.some((cl: Label) => cl.id === lbl.id);
                  return (
                    <div
                      key={lbl.id}
                      className="group flex cursor-pointer items-center gap-x-2 rounded-sm p-1 hover:bg-muted"
                      onClick={() => handleToggle(lbl)}
                    >
                      <div
                        className="flex h-8 w-full items-center rounded-sm px-3 text-sm font-bold text-white transition hover:opacity-80"
                        style={{ backgroundColor: lbl.colorCode }}
                      >
                        {lbl.name}
                      </div>
                      {isAssigned && (
                        <div className="flex h-8 w-8 items-center justify-center shrink-0 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {!isAssigned && (
                        <div className="flex h-8 w-8 items-center justify-center shrink-0"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">No labels found.</p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full justify-center"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create a new label
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input
                autoFocus
                className="mt-1 h-8 text-sm"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Label name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Select a color</label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {presetColors.map((c) => (
                  <div
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-8 w-full cursor-pointer rounded-sm hover:opacity-80
                      ${newColor === c ? 'ring-2 ring-black ring-offset-2' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-x-2 mt-2">
              <Button size="sm" onClick={handleCreate} className="w-full">Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
