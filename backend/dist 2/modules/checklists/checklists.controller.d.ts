import { ChecklistsService } from './checklists.service';
import { UpdateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './dto';
import { ChecklistItem } from '../../database/entities';
export declare class ChecklistsController {
    private readonly checklistsService;
    constructor(checklistsService: ChecklistsService);
    updateChecklist(id: string, updateChecklistDto: UpdateChecklistDto): Promise<import("../../database/entities").Checklist>;
    removeChecklist(id: string): Promise<void>;
    restoreChecklist(id: string): Promise<import("../../database/entities").Checklist>;
    createChecklistItem(checklistId: string, createChecklistItemDto: CreateChecklistItemDto): Promise<ChecklistItem>;
    updateChecklistItem(id: string, updateChecklistItemDto: UpdateChecklistItemDto, userId: string): Promise<ChecklistItem>;
    removeChecklistItem(id: string): Promise<void>;
    restoreChecklistItem(id: string): Promise<ChecklistItem>;
}
