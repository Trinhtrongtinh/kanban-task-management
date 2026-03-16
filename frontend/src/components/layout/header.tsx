'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Menu,
  LogOut,
  Settings,
  User,
  Briefcase,
  LayoutDashboard,
  CreditCard,
  Loader2,
  List as ListIcon,
  MessageSquare,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { WorkspaceSwitcher } from '@/components/workspaces/workspace-switcher';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { searchApi, type SearchEntityType } from '@/api/search';
import { cn, resolveAvatarUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';

function getBreadcrumb(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' > ');
}

function truncateText(value: string, maxLength = 90) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedType, setSelectedType] = useState<SearchEntityType>('all');
  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  const isSearchEnabled = debouncedQuery.length >= 2 && isSearchFocused;

  const {
    data: searchResult,
    isFetching: isSearching,
    isError: isSearchError,
  } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: ({ signal }) => searchApi.global(debouncedQuery, signal),
    enabled: isSearchEnabled,
    staleTime: 20_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const visibleWorkspaces = (searchResult?.workspaces ?? []).slice(0, 6);
  const visibleBoards = (searchResult?.boards ?? []).slice(0, 6);
  const visibleLists = (searchResult?.lists ?? []).slice(0, 6);
  const visibleCards = (searchResult?.cards ?? []).slice(0, 8);
  const visibleComments = (searchResult?.comments ?? []).slice(0, 8);

  const counts = {
    all:
      visibleWorkspaces.length +
      visibleBoards.length +
      visibleLists.length +
      visibleCards.length +
      visibleComments.length,
    workspace: visibleWorkspaces.length,
    board: visibleBoards.length,
    list: visibleLists.length,
    card: visibleCards.length,
    comment: visibleComments.length,
  } satisfies Record<SearchEntityType, number>;

  const hasResults = counts[selectedType] > 0;

  const showSearchPopover = isSearchFocused && query.trim().length > 0;

  const SEARCH_FILTERS: Array<{ type: SearchEntityType; label: string }> = [
    { type: 'all', label: t('search.all') },
    { type: 'workspace', label: t('search.workspace') },
    { type: 'board', label: t('search.board') },
    { type: 'list', label: t('search.list') },
    { type: 'card', label: t('search.card') },
    { type: 'comment', label: t('search.comment') },
  ];

  const SEARCH_EMPTY_LABEL: Record<SearchEntityType, string> = {
    all: t('search.all').toLowerCase(),
    workspace: t('search.workspace').toLowerCase(),
    board: t('search.board').toLowerCase(),
    list: t('search.list').toLowerCase(),
    card: t('search.card').toLowerCase(),
    comment: t('search.comment').toLowerCase(),
  };

  useEffect(() => {
    if (!query.trim()) {
      setSelectedType('all');
    }
  }, [query]);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const resolvedAvatarBase = resolveAvatarUrl(user?.avatarUrl);
  const currentUserAvatarSrc = resolvedAvatarBase
    ? `${resolvedAvatarBase}${resolvedAvatarBase.includes('?') ? '&' : '?'}v=${encodeURIComponent(
        user?.updatedAt || 'avatar',
      )}`
    : undefined;

  const goToResult = (path: string) => {
    router.push(path);
    setIsSearchFocused(false);
    setQuery('');
    setSelectedType('all');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Menu button (mobile) + Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('common.toggleMenu')}</span>
          </Button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">K</span>
            </div>
            <span className="hidden font-semibold sm:inline-block">Kanban</span>
          </Link>
          <div className="hidden md:block ml-4">
            <WorkspaceSwitcher />
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 items-center justify-center px-4 md:px-8">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.searchPlaceholder')}
              className="w-full pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsSearchFocused(false), 160);
              }}
            />
            {showSearchPopover && (
              <div className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-full w-[460px] rounded-md border bg-popover p-2 shadow-md">
                <div className="mb-2 flex flex-wrap gap-1 border-b pb-2">
                  {SEARCH_FILTERS.map((filter) => (
                    <Button
                      key={filter.type}
                      type="button"
                      size="xs"
                      variant={selectedType === filter.type ? 'secondary' : 'ghost'}
                      className={cn(
                        'rounded-full',
                        selectedType !== filter.type && 'text-muted-foreground',
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setSelectedType(filter.type)}
                    >
                      <span>{filter.label}</span>
                      <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
                        {counts[filter.type]}
                      </span>
                    </Button>
                  ))}
                </div>

                {!isSearchEnabled ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    {t('common.searchMinChars')}
                  </div>
                ) : isSearchError ? (
                  <div className="px-3 py-4 text-sm text-destructive">
                    {t('common.searchError')}
                  </div>
                ) : isSearching ? (
                  <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.searchLoading')}
                  </div>
                ) : !hasResults ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    {selectedType === 'all'
                      ? t('common.searchNoResult')
                      : `${t('common.searchNoResult')} (${SEARCH_EMPTY_LABEL[selectedType]})`}
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-2 overflow-y-auto">
                    {(selectedType === 'all' || selectedType === 'workspace') && visibleWorkspaces.length > 0 && (
                      <div>
                        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t('search.workspace')}</p>
                        {visibleWorkspaces.map((workspace) => (
                          <button
                            key={workspace.id}
                            className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goToResult(`/workspaces/${workspace.id}`)}
                          >
                            <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{workspace.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{t('search.workspaceType')}: {workspace.type}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {(selectedType === 'all' || selectedType === 'board') && visibleBoards.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t('search.board')}</p>
                        {visibleBoards.map((board) => (
                          <button
                            key={board.id}
                            className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goToResult(`/b/${board.id}`)}
                          >
                            <LayoutDashboard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{board.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{board.workspaceName}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {(selectedType === 'all' || selectedType === 'list') && visibleLists.length > 0 && (
                      <div>
                        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t('search.list')}</p>
                        {visibleLists.map((list) => (
                          <button
                            key={list.id}
                            className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goToResult(`/b/${list.boardId}?listId=${list.id}`)}
                          >
                            <ListIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{list.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {getBreadcrumb([list.workspaceName, list.boardTitle])}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {(selectedType === 'all' || selectedType === 'card') && visibleCards.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t('search.card')}</p>
                        {visibleCards.map((card) => (
                          <button
                            key={card.id}
                            className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              goToResult(`/b/${card.boardId}?cardId=${card.id}&focus=activity`);
                            }}
                          >
                            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{card.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {getBreadcrumb([card.workspaceName, card.boardTitle, card.listTitle])}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {(selectedType === 'all' || selectedType === 'comment') && visibleComments.length > 0 && (
                      <div>
                        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{t('search.comment')}</p>
                        {visibleComments.map((comment) => (
                          <button
                            key={comment.id}
                            className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              goToResult(`/b/${comment.boardId}?cardId=${comment.cardId}&commentId=${comment.id}&focus=activity`)
                            }
                          >
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {truncateText(comment.content)}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {getBreadcrumb([
                                  comment.workspaceName,
                                  comment.boardTitle,
                                  comment.listTitle,
                                  comment.cardTitle,
                                ])}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          {/* PRO/FREE Badge */}
          {user?.planType && (
            <Badge
              className={cn(
                'h-6 text-xs font-semibold flex items-center gap-1',
                user.planType === 'PRO'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400/50 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
              )}
            >
              {user.planType === 'PRO' && <Zap className="h-3 w-3" />}
              {user.planType}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUserAvatarSrc} alt={user?.fullName || user?.username || 'User'} />
                  <AvatarFallback>
                    {user?.fullName || user?.username ? getInitials(user.fullName || user.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName || user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('common.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('common.settings')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
