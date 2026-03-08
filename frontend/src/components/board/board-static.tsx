'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { BoardList } from './types';

interface BoardStaticProps {
  lists: BoardList[];
}

/** Giao diện tĩnh giống board, không dùng DndContext/useSortable - dùng khi chưa mount để tránh hydration mismatch */
export function BoardStatic({ lists }: BoardStaticProps) {
  return (
    <div className="flex h-full gap-4 p-2">
      {lists.map((list) => (
        <div
          key={list.id}
          className="flex h-fit max-h-full w-[272px] shrink-0 flex-col rounded-xl bg-[#f1f2f4] p-3"
        >
          <div className="mb-3 font-semibold text-foreground">{list.title}</div>
          <div className="flex min-h-[60px] flex-1 flex-col space-y-2">
            {list.cards.map((card) => (
              <div
                key={card.id}
                className="rounded-md border border-transparent bg-white px-3 py-2 shadow-sm"
              >
                <span className="text-sm text-foreground">{card.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
