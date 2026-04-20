import { Repository, DataSource } from 'typeorm';
import { Card, List, BoardMember } from '../../database/entities';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto';
import { ActivitiesService } from '../activities/activities.service';
import { CardsGateway } from './cards.gateway';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CardsService {
    private readonly cardRepository;
    private readonly listRepository;
    private readonly boardMemberRepository;
    private readonly dataSource;
    private readonly activitiesService;
    private readonly cardsGateway;
    private readonly notificationsService;
    constructor(cardRepository: Repository<Card>, listRepository: Repository<List>, boardMemberRepository: Repository<BoardMember>, dataSource: DataSource, activitiesService: ActivitiesService, cardsGateway: CardsGateway, notificationsService: NotificationsService);
    private validateAssigneeInBoard;
    private validateMemberInBoard;
    private validateListExists;
    private calculateNewPosition;
    create(createCardDto: CreateCardDto, userId: string): Promise<Card>;
    findAllByList(listId: string): Promise<Card[]>;
    findOne(id: string): Promise<Card>;
    update(id: string, updateCardDto: UpdateCardDto, userId: string): Promise<Card>;
    addMember(cardId: string, userId: string, addedByUserId?: string): Promise<Card>;
    removeMember(cardId: string, userId: string): Promise<Card>;
    remove(id: string): Promise<void>;
    restore(id: string): Promise<Card>;
    moveCard(id: string, moveCardDto: MoveCardDto, userId: string): Promise<Card>;
}
