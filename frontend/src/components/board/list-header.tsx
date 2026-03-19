'use client';

import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useState, useRef, useEffect } from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import type { BoardList } from './types';
import { useBoard } from './board-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateList, useDeleteList } from '@/hooks/data/use-lists';
import { useI18n } from '@/hooks/ui/use-i18n';
import { cn } from '@/lib/utils';
import { getBoardUiTheme } from '@/lib/board-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ListHeaderProps {
  list: BoardList;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
}

export function ListHeader({ list, dragListeners, dragAttributes }: ListHeaderProps) {
  const { t } = useI18n();
  const { boardBackgroundUrl } = useBoard();
  const uiTheme = getBoardUiTheme(boardBackgroundUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const onEnableEditing = () => {
    setIsEditing(true);
    setTitle(list.title);
  };

  const onDisableEditing = () => {
    setIsEditing(false);
  };

  const handleSubmit = () => {
    if (title.trim() === '') {
      setTitle(list.title);
    } else if (title !== list.title) {
      updateList.mutate({ id: list.id, payload: { title }, boardId: list.boardId });
    }
    onDisableEditing();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(list.title);
      onDisableEditing();
    }
  };

  const onDelete = () => {
    deleteList.mutate({ id: list.id, boardId: list.boardId });
  };

  return (
    <div className={cn('flex items-center justify-between pb-2 px-1 gap-x-2', uiTheme.listHeaderClassName)}>
      {/* Drag handle */}
      <div
        className={cn('shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors', uiTheme.dragHandleClassName)}
        {...dragListeners}
        {...dragAttributes}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={onKeyDown}
            className={cn('h-7 px-2 font-semibold ring-0 outline-none w-full', uiTheme.listInputClassName)}
          />
        ) : (
          <div
            onClick={onEnableEditing}
            className={cn('w-full text-sm font-semibold px-2 h-7 flex items-center border-transparent transition truncate cursor-text', uiTheme.listTitleClassName)}
          >
            {list.title}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn('h-auto w-auto p-1.5', uiTheme.menuButtonClassName)}>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="text-sm font-medium text-center text-muted-foreground pb-2 border-b mb-2">
            {t('board.listActions')}
          </div>
          <DropdownMenuItem onClick={onEnableEditing} className="cursor-pointer">
            {t('board.renameList')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
            {t('board.deleteList')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}