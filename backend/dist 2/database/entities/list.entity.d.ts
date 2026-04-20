import { Board } from './board.entity';
import { Card } from './card.entity';
export declare class List {
    id: string;
    boardId: string;
    board: Board;
    title: string;
    position: number;
    cards: Card[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
