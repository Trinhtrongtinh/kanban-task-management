import { Workspace } from './workspace.entity';
import { List } from './list.entity';
import { Label } from './label.entity';
export declare enum BoardVisibility {
    PRIVATE = "Private",
    WORKSPACE = "Workspace",
    PUBLIC = "Public"
}
export declare class Board {
    id: string;
    workspaceId: string;
    workspace: Workspace;
    title: string;
    backgroundUrl: string | null;
    visibility: BoardVisibility;
    slug: string;
    lists: List[];
    labels: Label[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
