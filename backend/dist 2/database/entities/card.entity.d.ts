import { List } from './list.entity';
import { Label } from './label.entity';
import { Checklist } from './checklist.entity';
import { Attachment } from './attachment.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';
export declare class Card {
    id: string;
    listId: string;
    list: List;
    assigneeId: string | null;
    assignee: User;
    members: User[];
    title: string;
    description: string | null;
    position: number;
    deadline: Date | null;
    isReminded: boolean;
    isArchived: boolean;
    labels: Label[];
    checklists: Checklist[];
    attachments: Attachment[];
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
