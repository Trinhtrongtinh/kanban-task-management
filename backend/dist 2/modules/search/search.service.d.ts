import { Repository } from 'typeorm';
import { Workspace, Board, Card, List, Comment } from '../../database/entities';
import { GlobalSearchDto, AdvancedSearchDto, DueDateFilter } from './dto';
export declare class SearchService {
    private readonly workspaceRepository;
    private readonly boardRepository;
    private readonly cardRepository;
    private readonly listRepository;
    private readonly commentRepository;
    constructor(workspaceRepository: Repository<Workspace>, boardRepository: Repository<Board>, cardRepository: Repository<Card>, listRepository: Repository<List>, commentRepository: Repository<Comment>);
    globalSearch(dto: GlobalSearchDto, userId: string): Promise<{
        workspaces: any[];
        boards: any[];
        lists: any[];
        cards: any[];
        comments: any[];
        total: {
            workspaces: number;
            boards: number;
            lists: number;
            cards: number;
            comments: number;
        };
    }>;
    advancedSearch(dto: AdvancedSearchDto, userId: string): Promise<{
        cards: Card[];
        total: number;
        filters: {
            boardId: string | null;
            labelIds: string[];
            dueDate: DueDateFilter | null;
        };
    }>;
}
