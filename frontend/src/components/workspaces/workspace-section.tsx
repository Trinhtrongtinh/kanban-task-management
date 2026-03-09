'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Board {
  id: string;
  title: string;
  backgroundColor?: string;
  backgroundImage?: string;
}

interface Workspace {
  id: string;
  name: string;
  boards: Board[];
}

// Gradient presets for boards
const BOARD_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-orange-500 to-orange-600',
  'from-green-500 to-green-600',
  'from-teal-500 to-teal-600',
  'from-indigo-500 to-indigo-600',
  'from-rose-500 to-rose-600',
];

function getGradient(index: number): string {
  return BOARD_GRADIENTS[index % BOARD_GRADIENTS.length];
}

interface BoardCardProps {
  board: Board;
  index: number;
}

function BoardCard({ board, index }: BoardCardProps) {
  const gradient = board.backgroundColor || getGradient(index);
  const hasImage = !!board.backgroundImage;

  return (
    <Link href={`/b/${board.id}`}>
      <div
        className={cn(
          'group relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg',
          !hasImage && `bg-gradient-to-br ${gradient}`
        )}
        style={
          hasImage
            ? {
                backgroundImage: `url(${board.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />

        {/* Board title */}
        <div className="absolute inset-0 flex items-end p-3">
          <h3 className="text-sm font-semibold text-white drop-shadow-md sm:text-base">
            {board.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

interface WorkspaceSectionProps {
  workspace: Workspace;
  icon?: React.ReactNode;
}

export function WorkspaceSection({ workspace, icon }: WorkspaceSectionProps) {
  return (
    <div className="space-y-4">
      {/* Workspace Header — clickable to go to workspace dashboard */}
      <Link
        href={`/workspaces/${workspace.id}`}
        className="group flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          {icon || (
            <span className="text-lg font-bold">
              {workspace.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold group-hover:underline">
          {workspace.name}
        </h2>
        <span className="text-sm text-muted-foreground">
          ({workspace.boards.length} boards)
        </span>
      </Link>

      {/* Boards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {workspace.boards.map((board, index) => (
          <BoardCard key={board.id} board={board} index={index} />
        ))}
      </div>
    </div>
  );
}

