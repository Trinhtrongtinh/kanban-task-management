'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  Layers3,
  Sparkles,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceSection } from '@/components/workspaces/workspace-section';
import { useWorkspaces } from '@/hooks/data/use-workspaces';
import { useWorkspaceModal } from '@/hooks/ui/use-workspace-modal';
import { workspacesApi } from '@/api/workspaces';
import { boardsApi } from '@/api/boards';
import { listsApi } from '@/api/lists';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { parseApiDate } from '@/lib/date-time';
import { useI18n } from '@/hooks/ui/use-i18n';
import { QUERY_STALE_TIME } from '@/lib/cache-ttl';

// ── Types ────────────────────────────────────────────────────────────

interface Board {
  id: string;
  title: string;
  backgroundUrl?: string | null;
  backgroundColor?: string;
  backgroundImage?: string;
}

interface CardMember {
  id: string;
}

interface DashboardCard {
  isArchived?: boolean;
  deadline?: string;
  members?: CardMember[];
}

interface DashboardList {
  cards?: DashboardCard[];
}

// ── Safe type helper for the UI components
export type WorkspaceWithNestedBoards = import('@/api/workspaces').Workspace & {
  boards?: Board[];
  ownerDisplayName?: string;
};

// ── Page component ───────────────────────────────────────────────────

export default function DashboardPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { t } = useI18n();
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const onOpenWorkspaceModal = useWorkspaceModal(s => s.onOpen);

  const workspaceMembersQueries = useQueries({
    queries: workspaces.map((workspace) => ({
      queryKey: ['workspace-members', workspace.id],
      queryFn: () => workspacesApi.getMembers(workspace.id),
      enabled: !!workspace.id,
      staleTime: 30_000,
    })),
  });

  const boardsQueries = useQueries({
    queries: workspaces.map((workspace) => ({
      // Include joinedOnly in key to avoid collisions with non-joined board queries.
      queryKey: ['boards', 'workspace', workspace.id, 'joined', true],
      queryFn: () => boardsApi.getBoardsByWorkspace(workspace.id, { joinedOnly: true }),
      enabled: !!workspace.id,
      staleTime: QUERY_STALE_TIME.BOARDS_BY_WORKSPACE_MS,
      refetchOnMount: 'always' as const,
    })),
  });

  const workspacesWithJoinedBoards = useMemo(
    () =>
      workspaces
        .map((workspace, index) => {
          const members = workspaceMembersQueries[index]?.data ?? [];
          const owner =
            members.find((member) => member.role === 'OWNER') ??
            members.find((member) => member.userId === workspace.ownerId);

          const ownerDisplayName =
            workspace.ownerId === currentUserId
              ? t('dashboard.youLabel')
              : owner?.user?.username ?? owner?.user?.email ?? t('dashboard.unknownOwner');

          return {
            ...workspace,
            boards: boardsQueries[index]?.data ?? [],
            ownerDisplayName,
          };
        })
        .filter((workspace) => (workspace.boards?.length ?? 0) > 0),
    [workspaces, boardsQueries, workspaceMembersQueries, currentUserId, t],
  );

  const allBoards = useMemo(
    () => workspacesWithJoinedBoards.flatMap((workspace) => workspace.boards ?? []),
    [workspacesWithJoinedBoards],
  );

  const listsQueries = useQueries({
    queries: allBoards.map((board) => ({
      queryKey: ['lists', 'board', board.id],
      queryFn: () => listsApi.getListsByBoard(board.id),
      enabled: !!board.id,
      staleTime: 30_000,
    })),
  });

  const totalMembers = useMemo(() => {
    const uniqueMemberIds = new Set<string>();

    workspaceMembersQueries.forEach((query) => {
      (query.data ?? []).forEach((member) => {
        uniqueMemberIds.add(member.userId);
      });
    });

    return uniqueMemberIds.size;
  }, [workspaceMembersQueries]);

  const assignedCards = useMemo(() => {
    if (!currentUserId) return [];

    return listsQueries
      .flatMap((query) => (query.data ?? []) as DashboardList[])
      .flatMap((list) => list.cards ?? [])
      .filter((card) => {
        if (card.isArchived) return false;
        const memberIds = (card.members ?? []).map((member) => member.id);
        return memberIds.includes(currentUserId);
      });
  }, [currentUserId, listsQueries]);

  const allActiveCards = useMemo(
    () =>
      listsQueries
        .flatMap((query) => (query.data ?? []) as DashboardList[])
        .flatMap((list) => list.cards ?? [])
        .filter((card) => !card.isArchived),
    [listsQueries],
  );

  const dueSoonCardsCount = useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    return allActiveCards.filter((card) => {
      if (!card.deadline) return false;
      const deadline = parseApiDate(card.deadline);
      return deadline >= now && deadline <= sevenDaysLater;
    }).length;
  }, [allActiveCards]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      id: 'workspaces',
      title: t('dashboard.totalWorkspaces'),
      value: workspaces.length,
      description: t('dashboard.totalWorkspacesDesc'),
      icon: Layers3,
      accentClassName:
        'from-cyan-500/20 via-blue-500/15 to-indigo-500/20 border-cyan-500/30',
    },
    {
      id: 'members',
      title: t('dashboard.totalMembers'),
      value: totalMembers,
      description: t('dashboard.totalMembersDesc'),
      icon: UserRoundCheck,
      accentClassName:
        'from-emerald-500/20 via-lime-500/15 to-teal-500/20 border-emerald-500/30',
    },
    {
      id: 'assigned',
      title: t('dashboard.assignedCards'),
      value: assignedCards.length,
      description: t('dashboard.assignedCardsDesc'),
      icon: Sparkles,
      accentClassName:
        'from-amber-500/20 via-orange-500/15 to-rose-500/20 border-amber-500/30',
    },
    {
      id: 'dueSoon',
      title: t('dashboard.dueSoon'),
      value: dueSoonCardsCount,
      description: t('dashboard.dueSoonDesc'),
      icon: CalendarClock,
      accentClassName:
        'from-fuchsia-500/20 via-violet-500/15 to-purple-500/20 border-fuchsia-500/30',
    },
  ];

  return (
    <div className="relative space-y-8 overflow-hidden">
      <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-12 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-2xl md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.35)_0%,transparent_42%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.32)_0%,transparent_44%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              <Sparkles className="h-3.5 w-3.5" />
              {t('dashboard.title')}
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">
              {t('dashboard.subtitle')}
            </h1>
            <p className="max-w-2xl text-sm text-white/80">
              {t('dashboard.workspacesDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-white/70">{t('dashboard.totalWorkspaces')}</p>
              <p className="text-xl font-bold">{workspaces.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-white/70">{t('dashboard.assignedCards')}</p>
              <p className="text-xl font-bold">{assignedCards.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats section ────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.id}
              className={`relative overflow-hidden border bg-gradient-to-br ${stat.accentClassName}`}
            >
              <div className="pointer-events-none absolute -right-6 -top-7 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between gap-2">
                  <div className="text-3xl font-black leading-none tracking-tight">{stat.value}</div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Workspaces Header ──────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t('dashboard.workspacesHeading')}</h2>
          <p className="text-muted-foreground/90">
            {t('dashboard.workspacesDescription')}
          </p>
        </div>
      </div>

      {/* ── Workspaces List ──────────────────────────────── */}
      {workspacesWithJoinedBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card/80 backdrop-blur-sm">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">{t('dashboard.emptyWorkspaceTitle')}</h2>
          <p className="mb-4 text-muted-foreground">
            {t('dashboard.emptyWorkspaceDesc2')}
          </p>
          <Button onClick={onOpenWorkspaceModal}>
            {t('dashboard.createFirstWorkspace')}
          </Button>
        </div>
      ) : (
        <div className="space-y-8 rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm md:p-6">
          {workspacesWithJoinedBoards.map((workspace, index) => (
            <WorkspaceSection
              key={workspace.id}
              workspace={workspace as WorkspaceWithNestedBoards}
              icon={
                index === 0 ? (
                  <Briefcase className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )
              }
            />
          ))}
        </div>
      )}

    </div>
  );
}
