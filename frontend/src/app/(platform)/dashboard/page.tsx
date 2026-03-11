'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Briefcase, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceSection } from '@/components/workspaces/workspace-section';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceModal } from '@/hooks/use-workspace-modal';
import { workspacesApi } from '@/api/workspaces';
import { boardsApi } from '@/api/boards';
import { listsApi } from '@/api/lists';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { parseApiDate } from '@/lib/date-time';

// ── Types ────────────────────────────────────────────────────────────

interface Board {
  id: string;
  title: string;
  backgroundColor?: string;
  backgroundImage?: string;
}

// ── Safe type helper for the UI components
export type WorkspaceWithNestedBoards = import('@/api/workspaces').Workspace & {
  boards?: Board[];
};

// ── Page component ───────────────────────────────────────────────────

export default function DashboardPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const user = useAuthStore((s) => s.user);
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const onOpenWorkspaceModal = useWorkspaceModal(s => s.onOpen);
  const isFreePlanLimitReached = user?.planType === 'FREE' && workspaces.length >= 1;

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
      queryKey: ['boards', 'workspace', workspace.id],
      queryFn: () => boardsApi.getBoardsByWorkspace(workspace.id),
      enabled: !!workspace.id,
      staleTime: 30_000,
    })),
  });

  const allBoards = useMemo(
    () => boardsQueries.flatMap((query) => query.data ?? []),
    [boardsQueries],
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
      .flatMap((query) => query.data ?? [])
      .flatMap((list) => list.cards ?? [])
      .filter((card: any) => {
        if (card.isArchived) return false;
        const memberIds = (card.members ?? []).map((member: { id: string }) => member.id);
        return memberIds.includes(currentUserId);
      });
  }, [currentUserId, listsQueries]);

  const allActiveCards = useMemo(
    () =>
      listsQueries
        .flatMap((query) => query.data ?? [])
        .flatMap((list) => list.cards ?? [])
        .filter((card: any) => !card.isArchived),
    [listsQueries],
  );

  const dueSoonCardsCount = useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    return allActiveCards.filter((card: any) => {
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

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h1>
          <p className="text-muted-foreground">
            Chào mừng bạn đến với ứng dụng quản lý công việc Kanban
          </p>
        </div>
      </div>

      {/* ── Stats section ────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Workspaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaces.length}</div>
            <p className="text-xs text-muted-foreground">
              Workspace bạn đang tham gia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thành viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Thành viên trong các workspace của bạn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thẻ đang làm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCards.length}</div>
            <p className="text-xs text-muted-foreground">
              Thẻ được giao cho bạn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sắp đến hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonCardsCount}</div>
            <p className="text-xs text-muted-foreground">
              Thẻ đến hạn trong 7 ngày
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Workspaces Header ──────────────────────────────── */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workspaces</h2>
          <p className="text-muted-foreground">
            Quản lý các workspace và bảng công việc của bạn
          </p>
        </div>
      </div>

      {/* ── Workspaces List ──────────────────────────────── */}
      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-card">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Tạm thời bạn chưa có workspace nào</h2>
          <p className="mb-4 text-muted-foreground">
            Vui lòng tạo 1 workspace cá nhân hoặc liên hệ Admin để xin cấp quyền.
          </p>
          <Button onClick={onOpenWorkspaceModal} disabled={isFreePlanLimitReached}>
            Tạo Workspace đầu tiên
          </Button>
        </div>
      ) : isFreePlanLimitReached ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-card">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Bạn đã đạt giới hạn Workspace</h2>
          <p className="mb-4 text-muted-foreground">
            Gói Free chỉ cho phép 1 workspace. Nâng cấp lên Pro để tạo thêm workspace khác.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {workspaces.map((workspace, index) => (
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
