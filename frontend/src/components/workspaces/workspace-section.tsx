'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveBoardBackground } from '@/lib/board-themes';
import { useI18n } from '@/hooks/ui/use-i18n';

interface Board {
  id: string;
  title: string;
  backgroundUrl?: string | null;
  backgroundColor?: string;
  backgroundImage?: string;
}

interface Workspace {
  id: string;
  name: string;
  ownerDisplayName?: string;
  boards?: Board[];
}

interface BoardCardProps {
  board: Board;
  index: number;
}

function BoardCard({ board, index }: BoardCardProps) {
  const background = resolveBoardBackground(
    board.backgroundUrl ?? board.backgroundImage ?? board.backgroundColor,
    index,
  );

  return (
    <Link href={`/b/${board.id}`} className="block w-[72vw] max-w-[280px] min-w-[220px] shrink-0 snap-start sm:w-[250px]">
      <div
        className={cn(
          'group relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg',
          background.className,
        )}
        style={background.style}
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
  const { t } = useI18n();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const boards = workspace.boards ?? [];
  const ownerDisplayName = workspace.ownerDisplayName ?? t('dashboard.unknownOwner');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [boards.length, updateScrollState]);

  const scrollRow = (direction: 'left' | 'right') => {
    const el = sliderRef.current;
    if (!el) return;

    const amount = Math.round(el.clientWidth * 0.9);
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const showScrollControls = canScrollLeft || canScrollRight;

  return (
    <div className="space-y-4">
      {/* Workspace Header — clickable to go to workspace dashboard */}
      <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold group-hover:underline">
              {workspace.name}
            </h2>
            <span className="text-xs text-muted-foreground sm:text-sm">
              {t('dashboard.ownerLabel')}: {ownerDisplayName}
            </span>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            ({boards.length} boards)
          </span>
        </Link>

        {showScrollControls && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRow('left')}
              disabled={!canScrollLeft}
              aria-label={t('dashboard.slideLeft')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/80 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRow('right')}
              disabled={!canScrollRight}
              aria-label={t('dashboard.slideRight')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/80 text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Boards Row Slider */}
      <div
        ref={sliderRef}
        onScroll={updateScrollState}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {boards.map((board, index) => (
          <BoardCard
            key={board.id}
            board={board}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
