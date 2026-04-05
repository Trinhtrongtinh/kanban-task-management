import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi, CreateCardPayload, UpdateCardPayload, MoveCardPayload } from '@/api/cards';
import { toast } from 'sonner';

export const CARD_QUERY_KEYS = {
    all: ['cards'] as const,
    byList: (listId: string) => [...CARD_QUERY_KEYS.all, 'list', listId] as const,
    detail: (id: string) => [...CARD_QUERY_KEYS.all, 'detail', id] as const,
};

export function useCreateCard() {
    return useMutation({
        mutationFn: (payload: CreateCardPayload) => cardsApi.create(payload),
        onSuccess: (data) => {
            // Because lists fetch includes cards, we don't strictly have a generic cards cache 
            // but we could just let the caller do whatever optimistically or we invalidate lists
            toast.success('Thành công', { description: 'Tạo thẻ thành công' });
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể tạo thẻ' });
        },
    });
}

export function useUpdateCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateCardPayload }) =>
            cardsApi.update(id, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: CARD_QUERY_KEYS.detail(data.id),
            });
            toast.success('Thành công', { description: 'Cập nhật thẻ thành công' });
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể cập nhật thẻ' });
        },
    });
}

export function useDeleteCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => cardsApi.delete(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['lists'] });
            toast.success('Thành công', {
                description: 'Đã xóa thẻ',
                action: {
                    label: 'Hoàn tác',
                    onClick: () => {
                        cardsApi
                            .restore(id)
                            .then(() => {
                                queryClient.invalidateQueries({ queryKey: ['lists'] });
                                toast.success('Đã khôi phục thẻ');
                            })
                            .catch((error: any) => {
                                toast.error('Không thể hoàn tác', {
                                    description:
                                        error.response?.data?.message || 'Thẻ không thể khôi phục',
                                });
                            });
                    },
                },
            });
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể xóa thẻ' });
        },
    });
}

export function useMoveCard() {
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: MoveCardPayload }) =>
            cardsApi.move(id, payload),
        onSuccess: () => {
            // Silent success for drag and drop
        },
        onError: (error: any) => {
            toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể di chuyển thẻ' });
        },
    });
}
