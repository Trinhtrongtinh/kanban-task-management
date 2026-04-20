import { ActivitiesService } from './activities.service';
import { GetActivitiesQueryDto } from './dto';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    findRecentByUser(userId: string, query: GetActivitiesQueryDto): Promise<{
        items: import("../../database/entities").ActivityLog[];
        nextCursor: string | null;
    }>;
    findBoardActivities(boardId: string, query: GetActivitiesQueryDto): Promise<{
        items: import("../../database/entities").ActivityLog[];
        nextCursor: string | null;
    }>;
}
