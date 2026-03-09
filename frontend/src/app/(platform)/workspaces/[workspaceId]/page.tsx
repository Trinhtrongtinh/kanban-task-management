'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ── Types ────────────────────────────────────────────────────────────

interface MockBoard {
  id: string;
  title: string;
  gradient: string;
}

// ── Mock data ────────────────────────────────────────────────────────

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

const INITIAL_BOARDS: MockBoard[] = [
  { id: 'board-1', title: 'Dự án Website Redesign', gradient: GRADIENT_PRESETS[0] },
  { id: 'board-2', title: 'Marketing Q1 2026', gradient: GRADIENT_PRESETS[1] },
  { id: 'board-3', title: 'Product Roadmap', gradient: GRADIENT_PRESETS[2] },
  { id: 'board-4', title: 'Bug Tracking', gradient: GRADIENT_PRESETS[3] },
];

const WORKSPACE_NAME = 'Công ty ABC';

// ── Sub-components ───────────────────────────────────────────────────

function BoardCard({ board }: { board: MockBoard }) {
  return (
    <Link href={`/b/${board.id}`}>
      <div
        className={cn(
          'group relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg',
          `bg-gradient-to-br ${board.gradient}`
        )}
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
  onCreateBoard: (title: string) => void;
}

function CreateBoardPopover({ onCreateBoard }: CreateBoardPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreateBoard(trimmed);
    setTitle('');
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg bg-muted/60 transition-colors hover:bg-muted"
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
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
                className={cn(
                  'h-6 cursor-pointer rounded-md bg-gradient-to-br transition-transform hover:scale-110',
                  g
                )}
              />
            ))}
          </div>

          <Input
            placeholder="Tên bảng..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Button type="submit" size="sm" className="w-full" disabled={!title.trim()}>
            Tạo
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [boards, setBoards] = useState<MockBoard[]>(INITIAL_BOARDS);

  const handleCreateBoard = useCallback(
    (title: string) => {
      const newBoard: MockBoard = {
        id: `board-${Date.now()}`,
        title,
        gradient: GRADIENT_PRESETS[boards.length % GRADIENT_PRESETS.length],
      };
      setBoards((prev) => [...prev, newBoard]);
    },
    [boards.length]
  );

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {WORKSPACE_NAME}
          </h1>
          <p className="text-sm text-muted-foreground">
            Workspace ID: {workspaceId} · {boards.length} boards
          </p>
        </div>
      </div>

      {/* ── Boards section label ────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Boards của bạn</h2>
      </div>

      {/* ── Board grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
        <CreateBoardPopover onCreateBoard={handleCreateBoard} />
      </div>
    </div>
  );
}
