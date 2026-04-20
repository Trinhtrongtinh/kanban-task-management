import { Board } from './board.entity';
import { Card } from './card.entity';
export declare class Label {
    id: string;
    boardId: string;
    board: Board;
    name: string;
    colorCode: string;
    cards: Card[];
}
