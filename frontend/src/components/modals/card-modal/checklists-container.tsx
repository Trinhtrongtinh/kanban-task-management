'use client';

import { useChecklists } from '@/api/checklists';
import { useCardModal } from '@/hooks/use-card-modal';
import { ChecklistComponent } from './checklist';

export function ChecklistsContainer() {
  const cardId = useCardModal((s) => s.id);
  const { data: checklists = [] } = useChecklists(cardId);

  if (!cardId || checklists.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30">
        {checklists.map((checklist) => (
          <ChecklistComponent
            key={checklist.id}
            checklist={checklist}
            cardId={cardId}
          />
        ))}
      </div>
    </div>
  );
}
