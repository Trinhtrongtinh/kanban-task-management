'use client';

import { useState, useCallback } from 'react';
import { Check, UserPlus, ChevronLeft, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUpdateBoard } from '@/hooks/use-boards';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { useWorkspaceMembers } from '@/hooks/use-workspaces';
import { useGetBoardMembers, useAddMemberToBoard, useRemoveMemberFromBoard } from '@/api/board-members';
import { resolveAvatarUrl } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';

// ── Shared Constants ────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────

interface BoardNavbarProps {
  boardId: string;
  title: string;
  workspaceId: string;
  backgroundUrl: string;
}

export function BoardNavbar({ boardId, title, workspaceId, backgroundUrl }: BoardNavbarProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const { data: boardMembers = [] } = useGetBoardMembers(boardId);
  const { data: workspaceMembers = [] } = useWorkspaceMembers(workspaceId);

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
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedBg, setEditedBg] = useState(backgroundUrl || GRADIENT_PRESETS[0]);
  const updateBoardMutation = useUpdateBoard();

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

  const boardMemberIds = new Set(boardMembers.map((m) => m.id));
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
    <div className="mb-2 flex w-full items-center justify-between rounded-lg border bg-background/80 px-4 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-x-4">
        <Button variant="ghost" size="sm" asChild className="text-foreground/80 hover:bg-accent">
          <Link href={workspaceId ? `/workspaces/${workspaceId}` : '/workspaces'}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="font-semibold">{t('board.backToWorkspaces')}</span>
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <div className="h-6 w-px bg-border" />

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
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-3 flex h-8 items-center gap-2 rounded-md border bg-background px-3 text-foreground/80 transition hover:bg-accent"
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

          {/* ── Settings Popover ─────────────────────────── */}
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 flex h-8 w-8 p-0 items-center justify-center rounded-md border bg-background text-foreground/80 transition hover:bg-accent"
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
                    <label className="text-sm font-medium">{t('board.backgroundColor')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADIENT_PRESETS.map((g, idx) => (
                        <div
                          key={idx}
                          onClick={() => setEditedBg(g)}
                          className={cn(
                            'h-8 cursor-pointer rounded-md bg-gradient-to-br transition-all hover:scale-105',
                            g,
                            editedBg === g ? 'ring-2 ring-primary ring-offset-2' : ''
                          )}
                        />
                      ))}
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
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

