import { User } from './user.entity';
import { Board } from './board.entity';
import { Card } from './card.entity';
import { ActivityAction } from '../../common/enums';
export declare class ActivityLog {
    id: string;
    userId: string;
    user: User;
    boardId: string | null;
    board: Board | null;
    cardId: string | null;
    card: Card | null;
    action: ActivityAction;
    entityTitle: string;
    details: Record<string, unknown> | null;
    content: string;
    createdAt: Date;
}
