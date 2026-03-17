import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi, CreateBoardPayload, UpdateBoardPayload } from '@/api/boards';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useProModal } from '@/hooks/ui/use-pro-modal';
import { QUERY_STALE_TIME } from '@/lib/cache-ttl';

export const BOARD_QUERY_KEYS = {
    all: ['boards'] as const,
    byWorkspace: (workspaceId: string) => [...BOARD_QUERY_KEYS.all, 'workspace', workspaceId] as const,
    detail: (id: string) => [...BOARD_QUERY_KEYS.all, 'detail', id] as const,
};

export function useBoardsByWorkspace(workspaceId: string | undefined | null) {
    return useQuery({
        queryKey: BOARD_QUERY_KEYS.byWorkspace(workspaceId!),
        queryFn: () => boardsApi.getBoardsByWorkspace(workspaceId!),
        enabled: !!workspaceId,
        staleTime: QUERY_STALE_TIME.BOARDS_BY_WORKSPACE_MS,
    });
}

export function useBoardById(id: string | undefined | null) {
    return useQuery({
        queryKey: BOARD_QUERY_KEYS.detail(id!),
        queryFn: () => boardsApi.getBoardById(id!),
        enabled: !!id,
    });
}

export function useCreateBoard() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const onOpenProModal = useProModal((state) => state.onOpen);

    return useMutation({
        mutationFn: (payload: CreateBoardPayload) => boardsApi.create(payload),
        onSuccess: (data) => {
            toast.success('Thành công', {
                description: 'Tạo bảng công việc mới thành công',
            });
            // Invalidate the boards list for that workspace
            queryClient.invalidateQueries({
                queryKey: BOARD_QUERY_KEYS.byWorkspace(data.workspaceId),
            });
            // Navigate straight to the board
            router.push(`/b/${data.id}`);
        },
        onError: (error: any) => {
            const code = error?.response?.data?.errorCode;
            if (code === 'PLAN_LIMIT_EXCEEDED') {
                onOpenProModal();
                toast.info('Giới hạn gói Free', {
                    description: error.response?.data?.message || 'Nâng cấp Pro để tạo không giới hạn bảng.',
                });
                return;
            }
            toast.error('Lỗi', {
                description: error.response?.data?.message || 'Không thể tạo bảng',
            });
        },
    });
}

export function useUpdateBoard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateBoardPayload }) =>
            boardsApi.update(id, payload),
        onSuccess: (data) => {
            toast.success('Thành công', {
                description: 'Cập nhật bảng thành công',
            });
            queryClient.invalidateQueries({
                queryKey: BOARD_QUERY_KEYS.detail(data.id),
            });
            queryClient.invalidateQueries({
                queryKey: BOARD_QUERY_KEYS.byWorkspace(data.workspaceId),
            });
        },
        onError: (error: any) => {
            toast.error('Lỗi', {
                description: error.response?.data?.message || 'Không thể cập nhật bảng',
            });
        },
    });
}

export function useDeleteBoard() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
            boardsApi.delete(id).then(() => workspaceId), // Pass workspaceId to onSuccess
        onSuccess: (workspaceId) => {
            toast.success('Thành công', {
                description: 'Đã xóa bảng công việc',
            });
            // Clear out references manually to be safe
            queryClient.invalidateQueries({
                queryKey: BOARD_QUERY_KEYS.byWorkspace(workspaceId),
            });
            router.push(`/workspaces/${workspaceId}`);
        },
        onError: (error: any) => {
            toast.error('Lỗi', {
                description: error.response?.data?.message || 'Không thể xóa bảng',
            });
        },
    });
}
