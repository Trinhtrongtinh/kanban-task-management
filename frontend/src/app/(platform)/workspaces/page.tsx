'use client';

import { useMemo } from 'react';
import { Briefcase, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSection, WorkspaceListSkeleton } from '@/components/workspaces';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceModal } from '@/hooks/use-workspace-modal';

type WorkspaceWithBoards = import('@/api/workspaces').Workspace & {
  boards?: Array<{ id: string; title: string; backgroundColor?: string }>;
};

export default function WorkspacesPage() {
  const { data: rawWorkspaces = [], isLoading } = useWorkspaces();
  const onOpenWorkspaceModal = useWorkspaceModal((s) => s.onOpen);

  const workspaces = useMemo(
    () => rawWorkspaces as WorkspaceWithBoards[],
    [rawWorkspaces]
  );

  const handleCreateWorkspace = () => {
    onOpenWorkspaceModal();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Quản lý các workspace và bảng công việc của bạn
          </p>
        </div>
        <Button onClick={handleCreateWorkspace}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo Workspace
        </Button>
      </div>

      {/* Workspaces List */}
      {isLoading ? (
        <WorkspaceListSkeleton />
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Chưa có workspace nào</h2>
          <p className="mb-4 text-muted-foreground">
            Tạo workspace đầu tiên để bắt đầu quản lý công việc của bạn
          </p>
          <Button onClick={handleCreateWorkspace}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo Workspace mới
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {workspaces.map((workspace, index) => (
            <WorkspaceSection
              key={workspace.id}
              workspace={workspace}
              icon={index === 0 ? <Briefcase className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
