import { Card } from './card.entity';
export declare class Attachment {
    id: string;
    cardId: string;
    card: Card;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
