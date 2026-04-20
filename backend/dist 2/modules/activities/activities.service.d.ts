import { Repository } from 'typeorm';
import { ActivityLog, Board, Card } from '../../database/entities';
import { CreateActivityLogDto, GetActivitiesQueryDto } from './dto';
export declare class ActivitiesService {
    private readonly activityLogRepository;
    private readonly boardRepository;
    private readonly cardRepository;
    private readonly logger;
    constructor(activityLogRepository: Repository<ActivityLog>, boardRepository: Repository<Board>, cardRepository: Repository<Card>);
    private validateBoardExists;
    private validateCardExists;
    logActivity(createActivityLogDto: CreateActivityLogDto): Promise<ActivityLog>;
    createLog(createActivityLogDto: CreateActivityLogDto): Promise<ActivityLog>;
    private getFilterStartDate;
    getActivities(query: GetActivitiesQueryDto, userId?: string, boardId?: string): Promise<{
        items: ActivityLog[];
        nextCursor: string | null;
    }>;
    findAllByBoard(boardId: string): Promise<ActivityLog[]>;
    findAllByCard(cardId: string): Promise<ActivityLog[]>;
    findRecentByUser(userId: string): Promise<ActivityLog[]>;
    handleCronCleanup(): Promise<void>;
}
