import { apiClient } from './client';

export type WorkspaceType = 'Business' | 'Education' | 'Personal';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: WorkspaceType;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface CreateWorkspacePayload {
  name: string;
  type?: WorkspaceType;
  description?: string;
  slug?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  type?: WorkspaceType;
  description?: string;
  slug?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

export const workspacesApi = {
  // ── Workspaces ────────────────────────────────────────────────────────

  /** GET /workspaces - Get all workspaces for current user */
  getAll: async (): Promise<Workspace[]> => {
    const res = await apiClient.get<{ data: Workspace[] }>('/workspaces');
    return res.data.data;
  },

  /** GET /workspaces/:id - Get a single workspace */
  getById: async (id: string): Promise<Workspace> => {
    const res = await apiClient.get<{ data: Workspace }>(`/workspaces/${id}`);
    return res.data.data;
  },

  /** POST /workspaces - Create a new workspace */
  create: async (payload: CreateWorkspacePayload): Promise<Workspace> => {
    const res = await apiClient.post<{ data: Workspace }>('/workspaces', payload);
    return res.data.data;
  },

  /** PATCH /workspaces/:id - Update workspace */
  update: async (id: string, payload: UpdateWorkspacePayload): Promise<Workspace> => {
    const res = await apiClient.patch<{ data: Workspace }>(`/workspaces/${id}`, payload);
    return res.data.data;
  },

  // ── Members ───────────────────────────────────────────────────────────

  /** GET /workspaces/:id/members - Get all members of a workspace */
  getMembers: async (id: string): Promise<WorkspaceMember[]> => {
    const res = await apiClient.get<{ data: WorkspaceMember[] }>(`/workspaces/${id}/members`);
    return res.data.data;
  },

  /** POST /workspaces/:id/invite - Invite a user by email */
  inviteMember: async (id: string, payload: InviteMemberPayload): Promise<WorkspaceMember> => {
    const res = await apiClient.post<{ data: WorkspaceMember }>(`/workspaces/${id}/invite`, payload);
    return res.data.data;
  },

  /** GET /workspaces/:id/accept-invite?token=... - Accept an invitation */
  acceptInvite: async (id: string, token: string): Promise<WorkspaceMember> => {
    const res = await apiClient.get<{ data: WorkspaceMember }>(`/workspaces/${id}/accept-invite`, {
      params: { token },
    });
    return res.data.data;
  },
};
