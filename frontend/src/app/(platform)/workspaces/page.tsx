'use client';

import { useMemo, useState } from 'react';
import { Briefcase, Users, Plus, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSection, WorkspaceListSkeleton } from '@/components/workspaces';
import { useDeletedOwnedWorkspaces, useRestoreWorkspace, useWorkspaces } from '@/hooks/data/use-workspaces';
import { useWorkspaceModal } from '@/hooks/ui/use-workspace-modal';
import { useI18n } from '@/hooks/ui/use-i18n';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatRelativeVN, formatRelative } from '@/lib/date-time';

type WorkspaceWithBoards = import('@/api/workspaces').Workspace & {
  boards?: Array<{ id: string; title: string; backgroundColor?: string }>;
};

export default function WorkspacesPage() {
  const { t, locale } = useI18n();
  const { data: rawWorkspaces = [], isLoading } = useWorkspaces();
  const { data: deletedWorkspaces = [], isLoading: isLoadingDeleted } = useDeletedOwnedWorkspaces();
  const restoreWorkspaceMutation = useRestoreWorkspace();
  const onOpenWorkspaceModal = useWorkspaceModal((s) => s.onOpen);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const workspaces = useMemo(
    () => rawWorkspaces as WorkspaceWithBoards[],
    [rawWorkspaces]
  );
  const canCreateWorkspace = workspaces.length === 0;

  const handleCreateWorkspace = () => {
    onOpenWorkspaceModal();
  };

  const handleRestoreWorkspace = (workspaceId: string) => {
    restoreWorkspaceMutation.mutate(workspaceId, {
      onSuccess: () => {
        toast.success(t('workspaceSettings.workspaceTrash.restoreSuccess'));
        if (deletedWorkspaces.length <= 1) setIsTrashOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || t('workspaceSettings.workspaceTrash.restoreFailed'));
      },
    });
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
        <div className="flex items-center gap-2">
          {deletedWorkspaces.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsTrashOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {t('workspaceSettings.workspaceTrash.button')}
              <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {deletedWorkspaces.length}
              </span>
            </Button>
          )}
          {canCreateWorkspace && (
            <Button onClick={handleCreateWorkspace}>
              <Plus className="mr-2 h-4 w-4" />
              {t('common.createWorkspace')}
            </Button>
          )}
        </div>
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

      {/* Workspace Trash Dialog */}
      <Dialog open={isTrashOpen} onOpenChange={setIsTrashOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              {t('workspaceSettings.workspaceTrash.title')}
            </DialogTitle>
            <DialogDescription>
              {t('workspaceSettings.workspaceTrash.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {isLoadingDeleted ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : deletedWorkspaces.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t('workspaceSettings.workspaceTrash.empty')}
              </div>
            ) : (
              deletedWorkspaces.map((workspace) => (
                <div key={workspace.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{workspace.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {workspace.deletedAt ? `${t('workspaceSettings.workspaceTrash.deletedAgo')} ${formatRelative(workspace.deletedAt, locale)}` : workspace.slug}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 ml-3 gap-1.5"
                    onClick={() => handleRestoreWorkspace(workspace.id)}
                    disabled={restoreWorkspaceMutation.isPending}
                  >
                    {restoreWorkspaceMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RotateCcw className="h-3.5 w-3.5" />
                    }
                    {t('workspaceSettings.workspaceTrash.restore')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

