import { ActivityAction } from '../../../common/enums';
export declare class CreateActivityLogDto {
    userId: string;
    boardId?: string;
    cardId?: string;
    action: ActivityAction;
    entityTitle: string;
    details?: Record<string, unknown>;
    content: string;
}
