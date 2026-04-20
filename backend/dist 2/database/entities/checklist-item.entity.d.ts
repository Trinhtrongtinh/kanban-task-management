import { Checklist } from './checklist.entity';
export declare class ChecklistItem {
    id: string;
    checklistId: string;
    checklist: Checklist;
    content: string;
    isDone: boolean;
    position: number;
    deletedAt: Date | null;
}
