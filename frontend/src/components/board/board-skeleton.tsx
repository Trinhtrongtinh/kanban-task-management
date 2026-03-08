'use client';

import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton loading giống layout cột + thẻ, dùng khi chưa mount */
export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4 p-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex h-fit w-[272px] shrink-0 flex-col rounded-xl bg-[#f1f2f4] p-3"
        >
          <Skeleton className="mb-3 h-5 w-24" />
          <div className="flex min-h-[60px] flex-col space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
