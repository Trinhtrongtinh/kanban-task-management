'use client';

import { useParams } from 'next/navigation';
import { BoardProvider } from '@/components/board/board-context';
import { ListContainer } from '@/components/board/list-container';

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.boardId as string;

  return (
    <BoardProvider boardId={boardId}>
      <div className="-m-6 h-[calc(100vh-64px)] overflow-x-auto overflow-y-hidden rounded-xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-4">
        <ListContainer />
      </div>
    </BoardProvider>
  );
}
