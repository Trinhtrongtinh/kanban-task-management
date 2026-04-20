import { DataSource, Repository } from 'typeorm';
import { List, Board } from '../../database/entities';
import { CreateListDto, UpdateListDto } from './dto';
import { CardsGateway } from '../cards/cards.gateway';
export declare class ListsService {
    private readonly listRepository;
    private readonly boardRepository;
    private readonly cardsGateway;
    private readonly dataSource;
    constructor(listRepository: Repository<List>, boardRepository: Repository<Board>, cardsGateway: CardsGateway, dataSource: DataSource);
    private validateBoardExists;
    private calculateNewPosition;
    create(createListDto: CreateListDto): Promise<List>;
    findAllByBoard(boardId: string): Promise<List[]>;
    findOne(id: string): Promise<List>;
    update(id: string, updateListDto: UpdateListDto): Promise<List>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<List>;
}
