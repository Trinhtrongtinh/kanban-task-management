'use client';

import { useState, useRef, useEffect } from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import type { BoardList } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateList, useDeleteList } from '@/hooks/use-lists';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ListHeaderProps {
  list: BoardList;
  dragListeners?: Record<string, any>;
  dragAttributes?: Record<string, any>;
}

export function ListHeader({ list, dragListeners, dragAttributes }: ListHeaderProps) {
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
    <div className="flex items-center justify-between pb-2 px-1 gap-x-2">
      {/* Drag handle */}
      <div
        className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-black/10 transition-colors text-muted-foreground"
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
            className="h-7 px-2 font-semibold bg-white ring-0 outline-none w-full"
          />
        ) : (
          <div
            onClick={onEnableEditing}
            className="w-full text-sm font-semibold px-2 h-7 flex items-center border-transparent hover:border-input focus:border-input transition truncate cursor-text"
          >
            {list.title}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto w-auto p-1.5 hover:bg-black/10">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="text-sm font-medium text-center text-muted-foreground pb-2 border-b mb-2">
            List actions
          </div>
          <DropdownMenuItem onClick={onEnableEditing} className="cursor-pointer">
            Rename list...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
            Delete list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}