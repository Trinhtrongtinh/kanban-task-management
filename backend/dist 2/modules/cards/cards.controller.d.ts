import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto';
import { Card, Checklist } from '../../database/entities';
import { LabelsService } from '../labels/labels.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { CreateChecklistDto } from '../checklists/dto';
export declare class CardsController {
    private readonly cardsService;
    private readonly labelsService;
    private readonly checklistsService;
    constructor(cardsService: CardsService, labelsService: LabelsService, checklistsService: ChecklistsService);
    create(createCardDto: CreateCardDto, userId: string): Promise<Card>;
    findOne(id: string): Promise<Card>;
    update(id: string, updateCardDto: UpdateCardDto, userId: string): Promise<Card>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<Card>;
    moveCard(id: string, moveCardDto: MoveCardDto, userId: string): Promise<Card>;
    addLabelToCard(cardId: string, labelId: string): Promise<Card>;
    removeLabelFromCard(cardId: string, labelId: string): Promise<Card>;
    createChecklist(cardId: string, createChecklistDto: CreateChecklistDto): Promise<Checklist>;
    findChecklistsByCard(cardId: string): Promise<Checklist[]>;
    assignMember(cardId: string, userId: string, currentUserId: string): Promise<Card>;
    unassignMember(cardId: string, userId: string): Promise<Card>;
}
