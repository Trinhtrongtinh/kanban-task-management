'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { BoardProvider } from '@/components/board/board-context';
import { ListContainer } from '@/components/board/list-container';
import { BoardNavbar } from '@/components/board/board-navbar';
import { ModalProvider } from '@/components/providers/modal-provider';
import { useBoardById } from '@/hooks/data/use-boards';
import { useCardModal } from '@/hooks/ui/use-card-modal';
import { Loader2 } from 'lucide-react';

export default function BoardDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boardId = params.boardId as string;
  const { data: board, isLoading } = useBoardById(boardId);
  const { onOpen, id: openedCardId, isOpen } = useCardModal();

  useEffect(() => {
    const cardId = searchParams.get('cardId');
    if (!cardId) return;
    if (isOpen && openedCardId === cardId) return;

    onOpen(cardId, boardId);
  }, [searchParams, boardId, onOpen, openedCardId, isOpen]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bgClass = board?.backgroundUrl || 'from-blue-500 to-blue-600';
  const isUrl = bgClass.startsWith('http');
  const bgStyle = isUrl ? { backgroundImage: `url(${bgClass})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};

  return (
    <BoardProvider boardId={boardId}>
      <div
        className={`-m-6 flex h-[calc(100vh-64px)] flex-col overflow-x-auto overflow-y-hidden rounded-xl p-4 ${isUrl ? '' : `bg-gradient-to-br ${bgClass}`}`}
        style={bgStyle}
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
