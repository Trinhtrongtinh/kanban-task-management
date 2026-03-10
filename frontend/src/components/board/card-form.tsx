'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useBoard } from './board-context';
import { useCreateCard } from '@/hooks/use-cards';

interface CardFormProps {
  listId: string;
}

export function CardForm({ listId }: CardFormProps) {
  const { boardId, setLists } = useBoard();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Small delay so the textarea is rendered before focusing
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [isEditing]);

  const createCard = useCreateCard();

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const tempId = `card-${Date.now()}`;

    // Optimistic: append card to the list instantly
    const newCard = {
      id: tempId,
      title: trimmed,
      boardId,
      members: [],
    };

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      )
    );

    createCard.mutate(
      { listId, title: trimmed },
      {
        onSuccess: (data) => {
          // Replace optimistic ID with real ID
          setLists((prev) =>
            prev.map((list) =>
              list.id === listId
                ? {
                  ...list,
                  cards: list.cards.map((c) => (c.id === tempId ? data : c)),
                }
                : list
            )
          );
        },
        onError: () => {
          // Rollback
          setLists((prev) =>
            prev.map((list) =>
              list.id === listId
                ? {
                  ...list,
                  cards: list.cards.filter((c) => c.id !== tempId),
                }
                : list
            )
          );
        },
      }
    );

    setTitle('');
    // Keep editing open so user can add multiple cards quickly
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [title, listId, boardId, setLists]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setTitle('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSubmit, handleCancel]
  );

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add a card
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        ref={textareaRef}
        placeholder="Enter a title for this card..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[54px] resize-none border-none bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
      />
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="h-8 px-3 text-sm"
        >
          Add card
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
