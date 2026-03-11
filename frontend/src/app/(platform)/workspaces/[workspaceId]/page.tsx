'use client';

import { use, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Briefcase, Settings, Loader2 } from 'lucide-react';
import { useBoardsByWorkspace, useCreateBoard } from '@/hooks/use-boards';
import { useWorkspace } from '@/hooks/use-workspaces';
import { Board } from '@/api/boards';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/stores/authStore';

// ── Shared Constants ──────────────────────────────────────────────────

const GRADIENT_PRESETS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-pink-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-orange-500',
];

const DEFAULT_GRADIENT = GRADIENT_PRESETS[0];



// ── Sub-components ───────────────────────────────────────────────────

function BoardCard({ board }: { board: Board }) {
  // If backgroundUrl isn't set, use a random preset based on the title length
  const bgClass =
    board.backgroundUrl ||
    GRADIENT_PRESETS[(board.title.length || 0) % GRADIENT_PRESETS.length];
  const isUrl = bgClass.startsWith('http');

  return (
    <Link href={`/b/${board.id}`}>
      <div
        className={cn(
          'group relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg',
          isUrl ? '' : `bg-gradient-to-br ${bgClass}`
        )}
        style={isUrl ? { backgroundImage: `url(${bgClass})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
        {/* Title */}
        <div className="absolute inset-0 flex items-end p-3">
          <h3 className="text-sm font-semibold text-white drop-shadow-md sm:text-base">
            {board.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

interface CreateBoardPopoverProps {
  workspaceId: string;
}

function CreateBoardPopover({ workspaceId }: CreateBoardPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0]);

  const createBoardMutation = useCreateBoard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createBoardMutation.mutate({
      title: trimmed,
      workspaceId,
      backgroundUrl: gradient, // We repurpose backgroundUrl to temporarily store gradient strings too!
      visibility: 'Workspace',
    }, {
      onSuccess: () => {
        setTitle('');
        setIsOpen(false);
      }
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg bg-muted/60 transition-colors hover:bg-muted font-medium text-muted-foreground border-dashed border-2 hover:border-solid hover:border-primary/50 hover:text-primary transition-all"
        >
          <div className="flex flex-col items-center gap-1">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Tạo bảng mới</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" side="right" sideOffset={8}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <h4 className="text-sm font-semibold">Tạo bảng mới</h4>

          {/* Color preview */}
          <div className="grid grid-cols-4 gap-1.5">
            {GRADIENT_PRESETS.map((g, i) => (
              <div
                key={i}
                onClick={() => setGradient(g)}
                className={cn(
                  'h-6 cursor-pointer rounded-md bg-gradient-to-br transition-all hover:scale-110',
                  g,
                  gradient === g ? 'ring-2 ring-primary ring-offset-1' : ''
                )}
              />
            ))}
          </div>

          <Input
            placeholder="Tên bảng..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={createBoardMutation.isPending}
            autoFocus
          />
          <Button type="submit" size="sm" className="w-full" disabled={!title.trim() || createBoardMutation.isPending}>
            {createBoardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo'}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function WorkspaceDashboardPage({
  params
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = use(params);
  const { user } = useAuthStore();
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId);
  const { data: boardsData, isLoading: isBoardsLoading } = useBoardsByWorkspace(workspaceId);
  const boards = Array.isArray(boardsData) ? boardsData : [];

  const isLoading = isWorkspaceLoading || isBoardsLoading;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-muted-foreground w-8 h-8" />
        </div>
      ) : (
        <>
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {workspace?.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Workspace ID: {workspaceId} · {boards.length} boards
                </p>
              </div>
            </div>

            {workspace?.ownerId === user?.id && (
              <Link href={`/workspaces/${workspaceId}/settings`}>
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Cài đặt Workspace
                </Button>
              </Link>
            )}
          </div>

          {/* ── Boards section label ────────────────────────── */}
          <h2 className="text-lg font-semibold pt-4">Boards của bạn</h2>

          {/* ── Board grid ──────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
            <CreateBoardPopover workspaceId={workspaceId} />
          </div>
        </>
      )}
    </div>
  );
}
