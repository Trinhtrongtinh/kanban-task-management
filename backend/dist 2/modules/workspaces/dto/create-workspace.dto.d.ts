import { WorkspaceType } from '../../../database/entities/workspace.entity';
export declare class CreateWorkspaceDto {
    name: string;
    slug?: string;
    description?: string;
    type?: WorkspaceType;
}
