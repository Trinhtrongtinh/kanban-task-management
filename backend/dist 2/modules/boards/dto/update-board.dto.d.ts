import { BoardVisibility } from '../../../database/entities/board.entity';
export declare class UpdateBoardDto {
    title?: string;
    slug?: string;
    backgroundUrl?: string;
    visibility?: BoardVisibility;
}
