import { Card } from './card.entity';
import { ChecklistItem } from './checklist-item.entity';
export declare class Checklist {
    id: string;
    cardId: string;
    card: Card;
    title: string;
    items: ChecklistItem[];
    deletedAt: Date | null;
}
