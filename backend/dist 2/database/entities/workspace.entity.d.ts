import { User } from './user.entity';
import { Board } from './board.entity';
export declare enum WorkspaceType {
    BUSINESS = "Business",
    EDUCATION = "Education",
    PERSONAL = "Personal"
}
export declare class Workspace {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: WorkspaceType;
    ownerId: string;
    owner: User;
    boards: Board[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
