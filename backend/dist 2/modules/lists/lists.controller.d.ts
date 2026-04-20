import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto } from './dto';
import { List } from '../../database/entities';
export declare class ListsController {
    private readonly listsService;
    constructor(listsService: ListsService);
    create(createListDto: CreateListDto): Promise<List>;
    findAllByBoard(boardId: string): Promise<List[]>;
    update(id: string, updateListDto: UpdateListDto): Promise<List>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<List>;
}
