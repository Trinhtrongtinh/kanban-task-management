import { BoardVisibility } from '../../../database/entities/board.entity';
export declare class CreateBoardDto {
    title: string;
    slug?: string;
    backgroundUrl?: string;
    visibility?: BoardVisibility;
    workspaceId: string;
}
