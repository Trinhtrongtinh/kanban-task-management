import { DataSource, Repository } from 'typeorm';
import { Board, Workspace, BoardMember } from '../../database/entities';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { User } from '../../database/entities';
import { AppCacheService } from '../../common/cache';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class BoardsService {
    private readonly boardRepository;
    private readonly workspaceRepository;
    private readonly boardMemberRepository;
    private readonly userRepository;
    private readonly dataSource;
    private readonly cacheService;
    private readonly activitiesService;
    private readonly notificationsService;
    constructor(boardRepository: Repository<Board>, workspaceRepository: Repository<Workspace>, boardMemberRepository: Repository<BoardMember>, userRepository: Repository<User>, dataSource: DataSource, cacheService: AppCacheService, activitiesService: ActivitiesService, notificationsService: NotificationsService);
    private getWorkspaceAudienceUserIds;
    private invalidateBoardsByWorkspace;
    private generateSlug;
    private ensureUniqueSlug;
    private validateWorkspaceExists;
    create(createBoardDto: CreateBoardDto, userId: string): Promise<Board>;
    findAllByWorkspace(workspaceId: string, userId: string, joinedOnly?: boolean): Promise<Board[]>;
    findDeletedByWorkspace(workspaceId: string): Promise<Board[]>;
    findOne(id: string): Promise<Board>;
    update(id: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<Board>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<Board>;
    getMembers(boardId: string): Promise<(User & {
        role: string;
    })[]>;
    addMember(boardId: string, userId: string, actorId: string): Promise<BoardMember>;
    removeMember(boardId: string, userId: string, actorId: string): Promise<void>;
}
