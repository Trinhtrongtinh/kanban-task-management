import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi, type CreateWorkspacePayload, type UpdateWorkspacePayload, type InviteMemberPayload } from '@/api/workspaces';
import { QUERY_STALE_TIME } from '@/lib/cache-ttl';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  deletedOwned: () => [...workspaceKeys.all, 'deleted-owned'] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  members: (id: string) => [...workspaceKeys.detail(id), 'members'] as const,
};

// ── Queries ─────────────────────────────────────────────────────────

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: workspacesApi.getAll,
    staleTime: QUERY_STALE_TIME.WORKSPACES_MS,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => workspacesApi.getById(id),
    enabled: !!id,
  });
}

export function useWorkspaceMembers(id: string) {
  return useQuery({
    queryKey: workspaceKeys.members(id),
    queryFn: () => workspacesApi.getMembers(id),
    enabled: !!id,
  });
}

export function useDeletedOwnedWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.deletedOwned(),
    queryFn: workspacesApi.getDeletedOwned,
  });
}

// ── Mutations ───────────────────────────────────────────────────────

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkspacePayload) => workspacesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkspacePayload }) =>
      workspacesApi.update(id, payload),
    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData(workspaceKeys.detail(updatedWorkspace.id), updatedWorkspace);
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(id) });
      queryClient.removeQueries({ queryKey: workspaceKeys.members(id) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.deletedOwned() });
    },
  });
}

export function useRestoreWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workspacesApi.restore(id),
    onSuccess: (restored) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.deletedOwned() });
      queryClient.setQueryData(workspaceKeys.detail(restored.id), restored);
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InviteMemberPayload }) =>
      workspacesApi.inviteMember(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) });
    },
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      workspacesApi.removeMember(id, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) });
    },
  });
}
