'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const userWorkspaces = [
  { id: 'ws-1', name: 'Công ty ABC' },
  { id: 'ws-2', name: 'Dự án cá nhân' },
];

export function WorkspaceSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Try to determine active workspace from URL (e.g. /workspaces/ws-1)
  const match = pathname.match(/\/workspaces\/(ws-[^\/]+)/);
  const activeWorkspaceId = match ? match[1] : null;

  const activeWorkspace = userWorkspaces.find(ws => ws.id === activeWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={false} className="w-[200px] justify-between h-9 bg-background/50 hover:bg-background/80">
          <span className="truncate">
            {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        {userWorkspaces.map(workspace => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
