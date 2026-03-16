import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi, CreateListPayload, UpdateListPayload } from '@/api/lists';
import { toast } from 'sonner';

export const LIST_QUERY_KEYS = {
    all: ['lists'] as const,
    byBoard: (boardId: string) => [...LIST_QUERY_KEYS.all, 'board', boardId] as const,
};

export function useListsByBoard(boardId: string | undefined | null) {
    return useQuery({
        queryKey: LIST_QUERY_KEYS.byBoard(boardId!),
        queryFn: () => listsApi.getListsByBoard(boardId!),
        enabled: !!boardId,
    });
}

export function useCreateList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateListPayload) => listsApi.create(payload),
        onSuccess: (data) => {
            queryClient.setQueryData(LIST_QUERY_KEYS.byBoard(data.boardId), (old: any) => {
                if (!old) return [data];
                if (!Array.isArray(old)) return old;

                const exists = old.some((list) => list.id === data.id);
                if (exists) return old;

                return [...old, data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            });

            queryClient.invalidateQueries({
                queryKey: LIST_QUERY_KEYS.byBoard(data.boardId),
            });
            toast.success('Thành công', { description: 'Tạo danh sách thành công' });
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể tạo danh sách' });
        },
    });
}

export function useUpdateList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload, boardId }: { id: string; payload: UpdateListPayload; boardId: string }) =>
            listsApi.update(id, payload).then(res => ({ ...res, _boardId: boardId })),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: LIST_QUERY_KEYS.byBoard(data._boardId),
            });
            // Silent update for drag-n-drop UX, so no toast here unless we want one
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể cập nhật danh sách' });
        },
    });
}

export function useDeleteList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, boardId }: { id: string; boardId: string }) =>
            listsApi.delete(id).then(() => boardId),
        onSuccess: (boardId) => {
            queryClient.invalidateQueries({
                queryKey: LIST_QUERY_KEYS.byBoard(boardId),
            });
            toast.success('Thành công', { description: 'Đã xóa danh sách' });
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể xóa danh sách' });
        },
    });
}
