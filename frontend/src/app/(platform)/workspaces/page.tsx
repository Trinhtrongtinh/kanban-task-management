'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSection, WorkspaceListSkeleton } from '@/components/workspaces';

// Mock data - sẽ thay thế bằng API call sau
const MOCK_WORKSPACES = [
  {
    id: 'ws-1',
    name: 'Công ty ABC',
    boards: [
      {
        id: 'board-1',
        title: 'Dự án Website Redesign',
        backgroundColor: 'from-blue-500 to-blue-600',
      },
      {
        id: 'board-2',
        title: 'Marketing Q1 2026',
        backgroundColor: 'from-purple-500 to-pink-500',
      },
      {
        id: 'board-3',
        title: 'Product Roadmap',
        backgroundColor: 'from-green-500 to-teal-500',
      },
      {
        id: 'board-4',
        title: 'Bug Tracking',
        backgroundColor: 'from-orange-500 to-red-500',
      },
    ],
  },
  {
    id: 'ws-2',
    name: 'Dự án cá nhân',
    boards: [
      {
        id: 'board-5',
        title: 'Học tiếng Anh',
        backgroundColor: 'from-indigo-500 to-purple-500',
      },
      {
        id: 'board-6',
        title: 'Kế hoạch du lịch 2026',
        backgroundColor: 'from-cyan-500 to-blue-500',
      },
    ],
  },
];

export default function WorkspacesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<typeof MOCK_WORKSPACES>([]);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setWorkspaces(MOCK_WORKSPACES);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateWorkspace = () => {
    // TODO: Open create workspace dialog
    console.log('Create workspace');
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
