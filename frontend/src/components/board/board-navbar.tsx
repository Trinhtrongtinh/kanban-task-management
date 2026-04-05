'use client';

import { useMemo, useState, useCallback } from 'react';
import { Check, UserPlus, ChevronLeft, Settings, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDeleteBoard, useUpdateBoard } from '@/hooks/data/use-boards';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { User } from '@/types';
import { useWorkspaceMembers } from '@/hooks/data/use-workspaces';
import { useGetBoardMembers, useAddMemberToBoard, useRemoveMemberFromBoard } from '@/api/board-members';
import { resolveAvatarUrl } from '@/lib/utils';
import { useI18n } from '@/hooks/ui/use-i18n';
import { useAuthStore } from '@/stores/authStore';
import {
  DEFAULT_BOARD_BACKGROUND,
  getBoardUiTheme,
  getBoardBackgroundOptionsByCategory,
  resolveBoardBackground,
} from '@/lib/board-themes';

// ── Component ────────────────────────────────────────────────────────

interface BoardNavbarProps {
  boardId: string;
  title: string;
  workspaceId: string;
  backgroundUrl: string;
}

export function BoardNavbar({ boardId, title, workspaceId, backgroundUrl }: BoardNavbarProps) {
  const { t, locale } = useI18n();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [isOpen, setIsOpen] = useState(false);

  const { data: boardMembers = [] } = useGetBoardMembers(boardId);
  const { data: workspaceMembers = [] } = useWorkspaceMembers(workspaceId);

  // Determine if the current user is a board admin
  const isAdmin = boardMembers.some(
    (m) => m.id === currentUserId && m.role === 'ADMIN',
  );

  const addMemberMutation = useAddMemberToBoard(boardId);
  const removeMemberMutation = useRemoveMemberFromBoard(boardId);

  // Extract valid users from workspace members
  const workspaceUsers: User[] = workspaceMembers
    .filter((wm) => wm.role === 'MEMBER')
    .map((wm) => wm.user)
    .filter((user): user is NonNullable<typeof user> => !!user)
    .map(u => ({
      id: u.id,
      name: u.username,
      username: u.username,
      email: u.email,
      avatarUrl: u.avatarUrl
    }));

  // Settings popover
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteBoardOpen, setIsDeleteBoardOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedBg, setEditedBg] = useState(backgroundUrl || DEFAULT_BOARD_BACKGROUND);
  const updateBoardMutation = useUpdateBoard();
  const deleteBoardMutation = useDeleteBoard();
  const themedOptions = useMemo(() => getBoardBackgroundOptionsByCategory('theme'), []);
  const gradientOptions = useMemo(() => getBoardBackgroundOptionsByCategory('gradient'), []);
  const previewBackground = resolveBoardBackground(editedBg);
  const uiTheme = getBoardUiTheme(backgroundUrl);

  const handleDeleteBoard = useCallback(() => {
    setIsSettingsOpen(false);
    setIsDeleteBoardOpen(true);
  }, []);

  const handleConfirmDeleteBoard = useCallback(() => {
    deleteBoardMutation.mutate({ id: boardId, workspaceId }, {
      onSuccess: () => setIsDeleteBoardOpen(false),
    });
  }, [boardId, workspaceId, deleteBoardMutation]);

  const handleUpdateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const payloadTitle = editedTitle.trim();
    if (!payloadTitle) return;

    updateBoardMutation.mutate({
      id: boardId,
      payload: {
        title: payloadTitle,
        backgroundUrl: editedBg
      }
    }, {
      onSuccess: () => {
        setIsSettingsOpen(false);
      }
    });
  };

  const boardMemberIds = useMemo(
    () => new Set(boardMembers.map((member) => member.id)),
    [boardMembers],
  );
  const invitedUsers = workspaceUsers.filter((user) => boardMemberIds.has(user.id));
  const invitableUsers = workspaceUsers.filter((user) => !boardMemberIds.has(user.id));

  const toggleMember = useCallback((user: User) => {
    const exists = boardMemberIds.has(user.id);
    if (exists) {
      removeMemberMutation.mutate({ boardId, userId: user.id });
    } else {
      addMemberMutation.mutate({ boardId, userId: user.id });
    }
  }, [boardMemberIds, addMemberMutation, removeMemberMutation, boardId]);

  return (
    <>
    <div className={cn('mb-2 flex w-full items-center justify-between rounded-lg px-4 py-2 backdrop-blur-sm', uiTheme.navbarClassName)}>
      <div className="flex items-center gap-x-4">
        <Button variant="ghost" size="sm" asChild className={cn(uiTheme.navbarButtonClassName, 'border')}>
          <Link href={workspaceId ? `/workspaces/${workspaceId}` : '/workspaces'}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="font-semibold">{t('board.backToWorkspaces')}</span>
          </Link>
        </Button>
        <div className="h-6 w-px bg-white/20" />
        <h2 className="text-lg font-bold text-current">{title}</h2>
        <div className="h-6 w-px bg-white/20" />

        {/* ── Facepile: overlapping avatars ────────────── */}
        <div className="flex items-center">
          <TooltipProvider delayDuration={200}>
            <div className="flex -space-x-2">
              {boardMembers.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 ring-2 ring-white transition-transform hover:z-10 hover:scale-110">
                      <AvatarImage src={resolveAvatarUrl(member.avatarUrl)} alt={member.username || member.name} />
                      <AvatarFallback className="bg-indigo-100 text-xs font-medium text-indigo-700">
                        {(member.username || member.name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {member.username || member.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* ── Invite Popover ─────────────────────────── */}
          {isAdmin && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('ml-3 flex h-8 items-center gap-2 rounded-md border px-3 transition', uiTheme.navbarButtonClassName)}
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">{t('board.addMember')}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-80 p-0"
              side="bottom"
              sideOffset={8}
            >
              <Command>
                <CommandInput placeholder={t('board.findMember')} />
                <CommandList>
                  <CommandEmpty>{t('board.noMemberFound')}</CommandEmpty>

                  <CommandGroup heading={t('board.canAddToBoard')}>
                    {invitableUsers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        {t('board.allInBoard')}
                      </div>
                    ) : (
                      invitableUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => toggleMember(user)}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2"
                          disabled={addMemberMutation.isPending || removeMemberMutation.isPending}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={resolveAvatarUrl(user.avatarUrl)} alt={user.username || user.name || ''} />
                            <AvatarFallback className="text-[10px] font-medium">
                              {(user.username || user.name || 'U').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">
                              {user.username || user.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          <span className="ml-auto text-[11px] text-primary">{t('board.addMember')}</span>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>

                  <CommandGroup heading={t('board.alreadyInBoard')}>
                    {invitedUsers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        {t('board.noBoardMembers')}
                      </div>
                    ) : (
                      invitedUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => toggleMember(user)}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2"
                          disabled={addMemberMutation.isPending || removeMemberMutation.isPending}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={resolveAvatarUrl(user.avatarUrl)} alt={user.username || user.name || ''} />
                            <AvatarFallback className="text-[10px] font-medium">
                              {(user.username || user.name || 'U').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">
                              {user.username || user.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          )}

          {/* ── Settings Popover ─────────────────────────── */}
          {isAdmin && (
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('ml-2 flex h-8 w-8 p-0 items-center justify-center rounded-md border transition', uiTheme.navbarButtonClassName)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-80"
              side="bottom"
              sideOffset={8}
            >
              <div className="space-y-4">
                <h4 className="font-medium leading-none">{t('board.boardSettings')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('board.boardSettingsDesc')}
                </p>
                <form onSubmit={handleUpdateBoard} className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('board.boardName')}</label>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder={t('board.boardNamePlaceholder')}
                      disabled={updateBoardMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('board.backgroundStyle')}</label>
                    <div
                      className={cn(
                        'relative h-24 overflow-hidden rounded-xl border shadow-sm',
                        previewBackground.className,
                      )}
                      style={previewBackground.style}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-white">
                        <span className="text-sm font-semibold">{editedTitle.trim() || title}</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                          {t('board.themePreview')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {t('board.backgroundStyle')}
                      </p>
                      {/* 2-row horizontal scroll grid */}
                      <div className="overflow-x-auto pb-1">
                        <div className="grid grid-rows-2 grid-flow-col gap-2 w-max">
                          {themedOptions.map((option) => {
                            const optionBackground = resolveBoardBackground(option.token);
                            return (
                              <button
                                key={option.token}
                                type="button"
                                onClick={() => setEditedBg(option.token)}
                                className={cn(
                                  'relative h-16 w-28 overflow-hidden rounded-lg border text-left transition-transform hover:scale-[1.02] shrink-0',
                                  editedBg === option.token ? 'ring-2 ring-primary ring-offset-2' : '',
                                  optionBackground.className,
                                )}
                                style={optionBackground.style}
                              >
                                <div className="absolute inset-0 bg-black/20" />
                                <span className="absolute inset-x-0 bottom-0 p-1.5 text-[10px] font-semibold text-white drop-shadow-sm leading-tight">
                                  {option.label[locale]}
                                </span>
                              </button>
                            );
                          })}
                          {gradientOptions.map((option) => {
                            const optionBackground = resolveBoardBackground(option.token);
                            return (
                              <button
                                key={option.token}
                                type="button"
                                onClick={() => setEditedBg(option.token)}
                                className={cn(
                                  'h-16 w-28 rounded-lg border transition-all hover:scale-105 shrink-0',
                                  editedBg === option.token ? 'ring-2 ring-primary ring-offset-2' : '',
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
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={updateBoardMutation.isPending || !editedTitle.trim()}
                  >
                    {updateBoardMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('board.save')}
                  </Button>
                </form>

                <div className="border-t pt-3">
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteBoard}
                    disabled={deleteBoardMutation.isPending}
                  >
                    {deleteBoardMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>{t('board.deleteBoard')}</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          )}
        </div>
      </div>
    </div>

    {/* ── Delete Board Confirmation Dialog ─────────── */}
    <Dialog open={isDeleteBoardOpen} onOpenChange={setIsDeleteBoardOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('board.deleteBoard')}</DialogTitle>
          <DialogDescription>
            {t('board.deleteBoardConfirm')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteBoardOpen(false)}
            disabled={deleteBoardMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDeleteBoard}
            disabled={deleteBoardMutation.isPending}
          >
            {deleteBoardMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('board.deleteBoard')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

