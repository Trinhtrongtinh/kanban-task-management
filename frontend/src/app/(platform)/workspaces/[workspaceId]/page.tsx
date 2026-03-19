'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Settings, Loader2, Minus } from 'lucide-react';
import { useBoardsByWorkspace, useCreateBoard } from '@/hooks/data/use-boards';
import { useWorkspace, useWorkspaceMembers } from '@/hooks/data/use-workspaces';
import { Board } from '@/api/boards';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/hooks/ui/use-i18n';
import {
  DEFAULT_BOARD_BACKGROUND,
  getBoardBackgroundOptionsByCategory,
  resolveBoardBackground,
} from '@/lib/board-themes';

// ── Sub-components ───────────────────────────────────────────────────

function BoardCard({ board }: { board: Board }) {
  const background = resolveBoardBackground(board.backgroundUrl, board.title.length || 0);

  return (
    <Link href={`/b/${board.id}`}>
      <div
        className={cn(
          'group relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg',
          background.className,
        )}
        style={background.style}
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
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [backgroundToken, setBackgroundToken] = useState(DEFAULT_BOARD_BACKGROUND);
  const themeOptions = useMemo(() => getBoardBackgroundOptionsByCategory('theme'), []);
  const gradientOptions = useMemo(() => getBoardBackgroundOptionsByCategory('gradient'), []);
  const previewBackground = resolveBoardBackground(backgroundToken);

  const createBoardMutation = useCreateBoard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createBoardMutation.mutate({
      title: trimmed,
      workspaceId,
      backgroundUrl: backgroundToken,
      visibility: 'Workspace',
    }, {
      onSuccess: () => {
        setTitle('');
        setBackgroundToken(DEFAULT_BOARD_BACKGROUND);
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
            <span className="text-sm font-medium">{t('board.createNewBoard')}</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" side="right" sideOffset={8}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <h4 className="text-sm font-semibold">{t('board.createNewBoard')}</h4>

          <div
            className={cn(
              'relative h-24 overflow-hidden rounded-xl border shadow-sm',
              previewBackground.className,
            )}
            style={previewBackground.style}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <p className="text-sm font-semibold">{title.trim() || t('board.createBoard')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('board.funThemes')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((option) => {
                  const optionBackground = resolveBoardBackground(option.token);

                  return (
                    <button
                      key={option.token}
                      type="button"
                      onClick={() => setBackgroundToken(option.token)}
                      className={cn(
                        'relative h-16 overflow-hidden rounded-lg border transition-transform hover:scale-[1.02]',
                        backgroundToken === option.token ? 'ring-2 ring-primary ring-offset-2' : '',
                        optionBackground.className,
                      )}
                      style={optionBackground.style}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="absolute inset-x-0 bottom-0 p-2 text-left text-[11px] font-semibold text-white">
                        {option.label[locale]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('board.classicGradients')}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {gradientOptions.map((option) => {
                  const optionBackground = resolveBoardBackground(option.token);

                  return (
                    <button
                      key={option.token}
                      type="button"
                      onClick={() => setBackgroundToken(option.token)}
                      className={cn(
                        'h-7 rounded-md transition-all hover:scale-110',
                        backgroundToken === option.token ? 'ring-2 ring-primary ring-offset-1' : '',
                        optionBackground.className,
                      )}
                      style={optionBackground.style}
                      title={option.label[locale]}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <Input
            placeholder={t('board.boardNamePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={createBoardMutation.isPending}
            autoFocus
          />
          <Button type="submit" size="sm" className="w-full" disabled={!title.trim() || createBoardMutation.isPending}>
            {createBoardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('board.createBoard')}
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
    const { t } = useI18n();
    const { user } = useAuthStore();
    const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId);
    const { data: members = [] } = useWorkspaceMembers(workspaceId);
    const { data: boardsData, isLoading: isBoardsLoading } = useBoardsByWorkspace(workspaceId);
    const boards = useMemo(() => (Array.isArray(boardsData) ? boardsData : []), [boardsData]);
    const BOARDS_PER_PAGE = 18;
    const totalPages = Math.max(1, Math.ceil(boards.length / BOARDS_PER_PAGE));
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');

  const ownerDisplayName = useMemo(() => {
    if (!workspace) return t('dashboard.unknownOwner');
    if (workspace.ownerId === user?.id) return t('dashboard.youLabel');

    const owner =
      members.find((member) => member.role === 'OWNER') ??
      members.find((member) => member.userId === workspace.ownerId);

    return owner?.user?.username ?? owner?.user?.email ?? t('dashboard.unknownOwner');
  }, [members, t, user?.id, workspace]);

  const isLoading = isWorkspaceLoading || isBoardsLoading;
  const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pagedBoards = useMemo(() => {
    const start = (normalizedPage - 1) * BOARDS_PER_PAGE;
    return boards.slice(start, start + BOARDS_PER_PAGE);
  }, [boards, normalizedPage]);

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(next);
    setPageInput(String(next));
  };

  const submitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(normalizedPage));
      return;
    }

    goToPage(Math.trunc(parsed));
  };

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
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {workspace?.name}
                  </h1>
                  <span className="text-sm text-muted-foreground">
                    {t('dashboard.ownerLabel')}: {ownerDisplayName}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {boards.length} {t('workspace.boardsCountLabel')}
                </p>
              </div>
            </div>

            {workspace?.ownerId === user?.id && (
              <Link href={`/workspaces/${workspaceId}/settings`}>
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  {t('workspace.settingsButton')}
                </Button>
              </Link>
            )}
          </div>

          {/* ── Boards section label ────────────────────────── */}
          <h2 className="text-lg font-semibold pt-4">{t('workspace.yourBoards')}</h2>

          {/* ── Board grid ──────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {pagedBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
            <CreateBoardPopover workspaceId={workspaceId} />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => goToPage(normalizedPage - 1)}
                disabled={normalizedPage <= 1}
                aria-label={t('workspace.pagination.prevAria')}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">{t('workspace.pagination.page')}</span>
                <Input
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={submitPageInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitPageInput();
                    }
                  }}
                  className="h-7 w-14 text-center"
                  inputMode="numeric"
                  aria-label={t('workspace.pagination.pageInputAria')}
                />
                <span className="text-muted-foreground">/ {totalPages}</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => goToPage(normalizedPage + 1)}
                disabled={normalizedPage >= totalPages}
                aria-label={t('workspace.pagination.nextAria')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
