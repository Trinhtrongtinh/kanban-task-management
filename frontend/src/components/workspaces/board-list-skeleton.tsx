import { Skeleton } from '@/components/ui/skeleton';

export function BoardListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className="aspect-video rounded-lg"
        />
      ))}
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <BoardListSkeleton />
    </div>
  );
}

export function WorkspaceListSkeleton() {
  return (
    <div className="space-y-8">
      <WorkspaceSkeleton />
      <WorkspaceSkeleton />
    </div>
  );
}
