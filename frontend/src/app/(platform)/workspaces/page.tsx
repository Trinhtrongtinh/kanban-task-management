'use client';

import { useMemo } from 'react';
import { Briefcase, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSection, WorkspaceListSkeleton } from '@/components/workspaces';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceModal } from '@/hooks/use-workspace-modal';
import { useI18n } from '@/hooks/use-i18n';

type WorkspaceWithBoards = import('@/api/workspaces').Workspace & {
  boards?: Array<{ id: string; title: string; backgroundColor?: string }>;
};

export default function WorkspacesPage() {
  const { t } = useI18n();
  const { data: rawWorkspaces = [], isLoading } = useWorkspaces();
  const onOpenWorkspaceModal = useWorkspaceModal((s) => s.onOpen);

  const workspaces = useMemo(
    () => rawWorkspaces as WorkspaceWithBoards[],
    [rawWorkspaces]
  );
  const canCreateWorkspace = workspaces.length === 0;

  const handleCreateWorkspace = () => {
    onOpenWorkspaceModal();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('common.workspaces')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.workspacesDescription')}
          </p>
        </div>
        {canCreateWorkspace && (
          <Button onClick={handleCreateWorkspace}>
            <Plus className="mr-2 h-4 w-4" />
            {t('common.createWorkspace')}
          </Button>
        )}
      </div>

      {/* Workspaces List */}
      {isLoading ? (
        <WorkspaceListSkeleton />
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">{t('dashboard.emptyWorkspaceTitle')}</h2>
          <p className="mb-4 text-muted-foreground">
            {t('dashboard.emptyWorkspaceDesc')}
          </p>
          <Button onClick={handleCreateWorkspace}>
            <Plus className="mr-2 h-4 w-4" />
            {t('common.createNewWorkspace')}
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
