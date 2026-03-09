// src/api/board-members.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";

// Mock API functions for board members
const fetchBoardMembers = async (boardId: string): Promise<User[]> => {
  const res = await fetch(`/api/boards/${boardId}/members`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const addMember = async ({ boardId, userId }: { boardId: string; userId: string }) => {
  const res = await fetch(`/api/boards/${boardId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to add member");
  return res.json();
};

const removeMember = async ({ boardId, userId }: { boardId: string; userId: string }) => {
  const res = await fetch(`/api/boards/${boardId}/members/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove member");
  return res.json();
};

// Mock function to fetch ALL users in the system to put in Command list
const fetchAllUsers = async (): Promise<User[]> => {
  const res = await fetch(`/api/users`);
  if (!res.ok) throw new Error("Failed to fetch full users list");
  return res.json();
};

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchAllUsers,
    // Provide a mocked list as initialData just to ensure it works in Frontend-only mode if no API exists
    initialData: [
      { id: "u1", name: "Alice", email: "alice@example.com", avatarUrl: "" },
      { id: "u2", name: "Bob", email: "bob@example.com", avatarUrl: "" },
      { id: "u3", name: "Charlie", email: "charlie@example.com", avatarUrl: "" },
    ],
  });
};

export const useGetBoardMembers = (boardId: string) => {
  return useQuery({
    queryKey: ["boards", boardId, "members"],
    queryFn: () => fetchBoardMembers(boardId),
    enabled: !!boardId,
    // MOCK initial data for demonstration if actual API is not ready
    initialData: [{ id: "u1", name: "Alice", email: "alice@example.com", avatarUrl: "" }],
  });
};

export const useAddMemberToBoard = (boardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMember,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: ["boards", boardId, "members"] });

      const previousMembers = queryClient.getQueryData<User[]>(["boards", boardId, "members"]) || [];
      const allUsers = queryClient.getQueryData<User[]>(["users"]) || [];

      const userToAdd = allUsers.find((u) => u.id === userId) || { id: userId, name: "New User", email: "" };
      
      const isAlreadyMember = previousMembers.some(m => m.id === userId);
      
      if (!isAlreadyMember) {
        queryClient.setQueryData<User[]>(["boards", boardId, "members"], [
          ...previousMembers,
          userToAdd,
        ]);
      }

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(["boards", boardId, "members"], context.previousMembers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "members"] });
    },
  });
};

export const useRemoveMemberFromBoard = (boardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: ["boards", boardId, "members"] });

      const previousMembers = queryClient.getQueryData<User[]>(["boards", boardId, "members"]) || [];

      queryClient.setQueryData<User[]>(
        ["boards", boardId, "members"],
        previousMembers.filter((m) => m.id !== userId)
      );

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(["boards", boardId, "members"], context.previousMembers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "members"] });
    },
  });
};
