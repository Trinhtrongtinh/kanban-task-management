import { apiClient } from './client';

export interface Attachment {
    id: string;
    cardId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    createdAt: string;
}

function parseDownloadFileName(contentDisposition?: string): string | null {
    if (!contentDisposition) return null;

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        } catch {
            return utf8Match[1];
        }
    }

    const fallbackMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (fallbackMatch?.[1]) {
        return fallbackMatch[1];
    }

    return null;
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

    restore: async (id: string): Promise<Attachment> => {
        const response = await apiClient.patch<{ data: Attachment }>(`/attachments/${id}/restore`);
        return response.data.data;
    },

    download: async (id: string, fallbackFileName: string): Promise<void> => {
        const response = await apiClient.get<Blob>(`/attachments/${id}/download`, {
            responseType: 'blob',
        });

        const contentType = response.headers['content-type'] ?? 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });
        const fileName =
            parseDownloadFileName(response.headers['content-disposition']) ||
            fallbackFileName ||
            `attachment-${id}`;

        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
    },
};
