'use client';

import { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateList } from '@/hooks/data/use-lists';
import { useI18n } from '@/hooks/ui/use-i18n';

interface ListCreatorProps {
  boardId: string;
}

export function ListCreator({ boardId }: ListCreatorProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const createList = useCreateList();
  const inputRef = useRef<HTMLInputElement>(null);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
    setTitle('');
  };

  const onSubmit = () => {
    if (title.trim() === '') {
      disableEditing();
      return;
    }
    createList.mutate({ title, boardId });
    disableEditing();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    } else if (e.key === 'Escape') {
      disableEditing();
    }
  };

  if (isEditing) {
    return (
      <div className="flex h-fit w-[272px] shrink-0 flex-col rounded-xl bg-card p-3 shadow-md border">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('board.listTitlePlaceholder')}
          className="h-9 px-2 text-sm font-medium bg-background outline-none"
        />
        <div className="flex items-center gap-x-1 mt-2">
          <Button onClick={onSubmit} size="sm" variant="default" className="w-[85px] h-8 shrink-0">
            {t('board.addList')}
          </Button>
          <Button onClick={disableEditing} size="sm" variant="ghost" className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={enableEditing}
      className="flex h-fit w-[272px] shrink-0 items-center rounded-xl bg-background/80 p-3 text-sm font-medium text-foreground transition hover:bg-background"
    >
      <Plus className="mr-2 h-4 w-4" />
      {t('board.addAnotherList')}
    </button>
  );
}
