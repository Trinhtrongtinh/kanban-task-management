'use client';

import { useState } from 'react';
import { Briefcase, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceSection } from '@/components/workspaces/workspace-section';

// ── Types ────────────────────────────────────────────────────────────

interface Board {
  id: string;
  title: string;
  backgroundColor: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  boards: Board[];
}

// ── Mock data ────────────────────────────────────────────────────────

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Công ty ABC',
    description: 'Workspace chính của công ty',
    boards: [
      { id: 'board-1', title: 'Dự án Website Redesign', backgroundColor: 'from-blue-500 to-blue-600' },
      { id: 'board-2', title: 'Marketing Q1 2026', backgroundColor: 'from-purple-500 to-pink-500' },
      { id: 'board-3', title: 'Product Roadmap', backgroundColor: 'from-green-500 to-teal-500' },
      { id: 'board-4', title: 'Bug Tracking', backgroundColor: 'from-orange-500 to-red-500' },
    ],
  },
  {
    id: 'ws-2',
    name: 'Dự án cá nhân',
    description: 'Quản lý các dự án cá nhân',
    boards: [
      { id: 'board-5', title: 'Học tiếng Anh', backgroundColor: 'from-indigo-500 to-purple-500' },
      { id: 'board-6', title: 'Kế hoạch du lịch 2026', backgroundColor: 'from-cyan-500 to-blue-500' },
    ],
  },
];

// ── Page component ───────────────────────────────────────────────────

export default function DashboardPage() {
  const [workspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);

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
            <CardTitle className="text-sm font-medium">Tổng Boards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.reduce((acc, ws) => acc + ws.boards.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Board bạn đang quản lý
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thẻ đang làm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
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
            <div className="text-2xl font-bold">3</div>
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
          <h2 className="mb-2 text-xl font-semibold">Chưa có workspace nào</h2>
          <p className="mb-4 text-muted-foreground">
            Hiện tại bạn chưa có workspace nào.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {workspaces.map((workspace, index) => (
            <WorkspaceSection
              key={workspace.id}
              workspace={workspace}
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
