import { User } from './user.entity';
import { Card } from './card.entity';
export declare class Comment {
    id: string;
    userId: string;
    user: User;
    cardId: string;
    card: Card;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
