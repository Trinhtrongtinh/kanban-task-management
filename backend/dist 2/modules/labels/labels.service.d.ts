import { Repository } from 'typeorm';
import { Label, Board, Card } from '../../database/entities';
import { CreateLabelDto, UpdateLabelDto } from './dto';
import { AppCacheService } from '../../common/cache';
export declare class LabelsService {
    private readonly labelRepository;
    private readonly boardRepository;
    private readonly cardRepository;
    private readonly cacheService;
    constructor(labelRepository: Repository<Label>, boardRepository: Repository<Board>, cardRepository: Repository<Card>, cacheService: AppCacheService);
    private invalidateBoardLabels;
    private validateBoardExists;
    private getCardWithLabels;
    create(createLabelDto: CreateLabelDto): Promise<Label>;
    findAllByBoard(boardId: string): Promise<Label[]>;
    findOne(id: string): Promise<Label>;
    update(id: string, updateLabelDto: UpdateLabelDto): Promise<Label>;
    remove(id: string): Promise<void>;
    addLabelToCard(cardId: string, labelId: string): Promise<Card>;
    removeLabelFromCard(cardId: string, labelId: string): Promise<Card>;
}
