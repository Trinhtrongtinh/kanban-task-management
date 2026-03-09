'use client';

import { useState, useCallback } from 'react';
import { Briefcase, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WorkspaceSection } from '@/components/workspaces';

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

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreateWorkspace = useCallback(() => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const workspace: Workspace = {
      id: `ws-${Date.now()}`,
      name: trimmedName,
      description: newDescription.trim() || undefined,
      boards: [],
    };

    setWorkspaces((prev) => [...prev, workspace]);
    setNewName('');
    setNewDescription('');
    setDialogOpen(false);
  }, [newName, newDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateWorkspace();
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Quản lý các workspace và bảng công việc của bạn
          </p>
        </div>

        {/* Create Workspace Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Tạo Workspace mới</DialogTitle>
                <DialogDescription>
                  Workspace giúp bạn tổ chức các boards và cộng tác với nhóm.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Tên workspace *</Label>
                  <Input
                    id="ws-name"
                    placeholder="VD: Công ty ABC, Team Marketing..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-desc">Mô tả (tùy chọn)</Label>
                  <Textarea
                    id="ws-desc"
                    placeholder="Mô tả ngắn gọn về workspace này..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={!newName.trim()}>
                  Tạo Workspace
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Workspaces List ──────────────────────────────── */}
      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Chưa có workspace nào</h2>
          <p className="mb-4 text-muted-foreground">
            Tạo workspace đầu tiên để bắt đầu quản lý công việc của bạn
          </p>
          <Button onClick={() => setDialogOpen(true)}>
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

