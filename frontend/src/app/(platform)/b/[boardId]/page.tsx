'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { BoardProvider } from '@/components/board/board-context';
import { ListContainer } from '@/components/board/list-container';
import { BoardNavbar } from '@/components/board/board-navbar';
import { ModalProvider } from '@/components/providers/modal-provider';
import { useBoardById } from '@/hooks/data/use-boards';
import { useCardModal } from '@/hooks/ui/use-card-modal';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveBoardBackground } from '@/lib/board-themes';

export default function BoardDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boardId = params.boardId as string;
  const { data: board, isLoading } = useBoardById(boardId);
  const { onOpen, id: openedCardId, isOpen } = useCardModal();
  const lastSyncedCardKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const cardId = searchParams.get('cardId');
    if (!cardId) {
      lastSyncedCardKeyRef.current = null;
      return;
    }

    const cardKey = `${boardId}:${cardId}`;
    if (lastSyncedCardKeyRef.current === cardKey) return;
    if (isOpen && openedCardId === cardId) return;

    lastSyncedCardKeyRef.current = cardKey;
    onOpen(cardId, boardId);
  }, [searchParams, boardId, onOpen, openedCardId, isOpen]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const boardBackground = resolveBoardBackground(board?.backgroundUrl, boardId.length);

  return (
    <BoardProvider boardId={boardId} boardBackgroundUrl={board?.backgroundUrl}>
      <div
        className={cn(
          '-m-6 flex h-[calc(100vh-64px)] flex-col overflow-x-auto overflow-y-hidden rounded-xl p-4',
          boardBackground.className,
        )}
        style={boardBackground.style}
      >
        <BoardNavbar
          boardId={boardId}
          title={board?.title || 'Board'}
          workspaceId={board?.workspaceId || ''}
          backgroundUrl={board?.backgroundUrl || ''}
        />
        <ListContainer />
      </div>
      <ModalProvider />
    </BoardProvider>
  );
}
