'use client';

import { ChevronsUpDown, Check, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaces } from '@/hooks/data/use-workspaces';
import { useWorkspaceModal } from '@/hooks/ui/use-workspace-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '@/hooks/ui/use-i18n';
import { useAuthStore } from '@/stores/authStore';

export function WorkspaceSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const onOpenWorkspaceModal = useWorkspaceModal((s) => s.onOpen);
  const currentUserId = useAuthStore((s) => s.user?.id);
  // Try to determine active workspace from URL (e.g. /workspaces/:workspaceId)
  const match = pathname.match(/\/workspaces\/([^\/]+)/);
  const activeWorkspaceId = match ? match[1] : null;

  const { data: workspaces = [], isLoading } = useWorkspaces();
  // Only count workspaces this user actually OWNS (not ones they joined as a member)
  const isWorkspaceLimitReached = workspaces.some((ws) => ws.ownerId === currentUserId);
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={false} className="w-[200px] justify-between h-9 bg-background/50 hover:bg-background/80">
          <span className="truncate">
            {isLoading ? (
              <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...</span>
            ) : activeWorkspace ? (
              activeWorkspace.name
            ) : (
              t('common.selectWorkspace')
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={() => router.push(`/workspaces/${workspace.id}`)}
            className="flex items-center justify-between cursor-pointer"
          >
            {workspace.name}
            {activeWorkspaceId === workspace.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {!isLoading && workspaces.length === 0 && (
          <div className="py-2 text-center text-xs text-muted-foreground">{t('common.noWorkspaceAvailable')}</div>
        )}
        {!isLoading && <DropdownMenuSeparator />}
        {!isLoading && !isWorkspaceLimitReached && (
          <DropdownMenuItem onSelect={onOpenWorkspaceModal} className="cursor-pointer gap-2">
            <Plus className="h-4 w-4" /> {t('common.createNewWorkspace')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
