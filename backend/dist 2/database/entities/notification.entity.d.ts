import { User } from './user.entity';
import { Card } from './card.entity';
export declare enum NotificationType {
    DEADLINE_REMINDER = "DEADLINE_REMINDER",
    CARD_ASSIGNED = "CARD_ASSIGNED",
    COMMENT_ADDED = "COMMENT_ADDED",
    CARD_MOVED = "CARD_MOVED",
    MENTION = "MENTION",
    WORKSPACE_INVITE = "WORKSPACE_INVITE",
    PAYMENT_NOTIFICATION = "PAYMENT_NOTIFICATION",
    BOARD_MEMBER_ADDED = "BOARD_MEMBER_ADDED"
}
export declare class Notification {
    id: string;
    userId: string;
    user: User;
    cardId: string | null;
    card: Card;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    metadata: Record<string, any> | null;
    createdAt: Date;
}
