import { SearchService } from './search.service';
import { GlobalSearchDto } from './dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
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
}
