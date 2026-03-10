import { apiClient } from './client';

export interface Attachment {
    id: string;
    cardId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    createdAt: string;
}

export const attachmentsApi = {
    upload: async (cardId: string, file: File): Promise<Attachment> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<{ data: Attachment }>(
            `/cards/${cardId}/attachments`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.data;
    },

    getByCard: async (cardId: string): Promise<Attachment[]> => {
        const response = await apiClient.get<{ data: Attachment[] }>(
            `/cards/${cardId}/attachments`
        );
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/attachments/${id}`);
    },
};
