import { Repository, DataSource } from 'typeorm';
import { Checklist, ChecklistItem, Card } from '../../database/entities';
import { CreateChecklistDto, UpdateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto, BulkCreateChecklistItemDto, BulkDeleteChecklistItemDto } from './dto';
import { ActivitiesService } from '../activities/activities.service';
export declare class ChecklistsService {
    private readonly checklistRepository;
    private readonly checklistItemRepository;
    private readonly cardRepository;
    private readonly activitiesService;
    private readonly dataSource;
    constructor(checklistRepository: Repository<Checklist>, checklistItemRepository: Repository<ChecklistItem>, cardRepository: Repository<Card>, activitiesService: ActivitiesService, dataSource: DataSource);
    private validateCardExists;
    private calculateNextPosition;
    createChecklist(cardId: string, createChecklistDto: CreateChecklistDto): Promise<Checklist>;
    findAllByCard(cardId: string): Promise<Checklist[]>;
    findOneChecklist(id: string): Promise<Checklist>;
    removeChecklist(id: string): Promise<void>;
    restoreChecklist(id: string): Promise<Checklist>;
    updateChecklist(id: string, updateChecklistDto: UpdateChecklistDto): Promise<Checklist>;
    createChecklistItem(createChecklistItemDto: CreateChecklistItemDto & {
        checklistId: string;
    }): Promise<ChecklistItem>;
    findOneChecklistItem(id: string): Promise<ChecklistItem>;
    updateChecklistItem(id: string, updateChecklistItemDto: UpdateChecklistItemDto, userId?: string): Promise<ChecklistItem>;
    removeChecklistItem(id: string): Promise<void>;
    restoreChecklistItem(id: string): Promise<ChecklistItem>;
    bulkCreateChecklistItems(checklistId: string, bulkCreateDto: BulkCreateChecklistItemDto): Promise<ChecklistItem[]>;
    bulkDeleteChecklistItems(bulkDeleteDto: BulkDeleteChecklistItemDto): Promise<{
        deletedCount: number;
    }>;
}
