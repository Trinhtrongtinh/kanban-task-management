import { User } from './user.entity';
import { Board } from './board.entity';
import { BoardRole } from '../../common/enums';
export declare class BoardMember {
    id: string;
    boardId: string;
    board: Board;
    userId: string;
    user: User;
    role: BoardRole;
    joinedAt: Date;
}
