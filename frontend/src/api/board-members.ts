import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { apiClient } from "./client";
import { toast } from "sonner";

export const BOARD_MEMBERS_KEYS = {
  all: ["boardMembers"] as const,
  byBoard: (boardId: string) => [...BOARD_MEMBERS_KEYS.all, boardId] as const,
};

const fetchBoardMembers = async (boardId: string): Promise<User[]> => {
  const res = await apiClient.get<{ data: User[] }>(`/boards/${boardId}/members`);
  return res.data.data;
};

const addMember = async ({ boardId, userId }: { boardId: string; userId: string }) => {
  const res = await apiClient.post(`/boards/${boardId}/members`, { userId });
  return res.data;
};

const removeMember = async ({ boardId, userId }: { boardId: string; userId: string }) => {
  const res = await apiClient.delete(`/boards/${boardId}/members/${userId}`);
  return res.data;
};

export const useGetBoardMembers = (boardId: string) => {
  return useQuery({
    queryKey: BOARD_MEMBERS_KEYS.byBoard(boardId),
    queryFn: () => fetchBoardMembers(boardId),
    enabled: !!boardId,
  });
};

export const useAddMemberToBoard = (boardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_MEMBERS_KEYS.byBoard(boardId) });
      toast.success("Đã thêm thành viên vào bảng");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể thêm thành viên");
    },
  });
};

export const useRemoveMemberFromBoard = (boardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_MEMBERS_KEYS.byBoard(boardId) });
      toast.success("Đã xóa thành viên khỏi bảng");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể xóa thành viên");
    },
  });
};
