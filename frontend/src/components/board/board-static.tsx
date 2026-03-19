'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { BoardList } from './types';
import { cn } from '@/lib/utils';
import { getBoardUiTheme } from '@/lib/board-themes';

interface BoardStaticProps {
  lists: BoardList[];
  boardBackgroundUrl?: string | null;
}

/** Giao diện tĩnh giống board, không dùng DndContext/useSortable - dùng khi chưa mount để tránh hydration mismatch */
export function BoardStatic({ lists, boardBackgroundUrl }: BoardStaticProps) {
  const uiTheme = getBoardUiTheme(boardBackgroundUrl);

  return (
    <div className="flex h-full gap-4 p-2">
      {lists.map((list) => (
        <div
          key={list.id}
          className={cn(
            'flex h-fit max-h-full w-[272px] shrink-0 flex-col rounded-xl p-3',
            uiTheme.listClassName,
          )}
        >
          <div className={cn('mb-3 font-semibold', uiTheme.listHeaderClassName)}>{list.title}</div>
          <div className="flex min-h-[60px] flex-1 flex-col space-y-2">
            {list.cards.map((card) => (
              <div
                key={card.id}
                className={cn('rounded-md px-3 py-2', uiTheme.cardClassName)}
              >
                <span className={cn('text-sm', uiTheme.cardTitleClassName)}>{card.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
