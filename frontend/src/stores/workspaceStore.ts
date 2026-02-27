import { create } from 'zustand';
import type { Workspace } from '@/types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,

  setWorkspaces: (workspaces) => set({ workspaces }),
  
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  
  addWorkspace: (workspace) => set((state) => ({
    workspaces: [...state.workspaces, workspace],
  })),
  
  updateWorkspace: (id, data) => set((state) => ({
    workspaces: state.workspaces.map((ws) =>
      ws.id === id ? { ...ws, ...data } : ws
    ),
    currentWorkspace:
      state.currentWorkspace?.id === id
        ? { ...state.currentWorkspace, ...data }
        : state.currentWorkspace,
  })),
  
  removeWorkspace: (id) => set((state) => ({
    workspaces: state.workspaces.filter((ws) => ws.id !== id),
    currentWorkspace:
      state.currentWorkspace?.id === id ? null : state.currentWorkspace,
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
}));
