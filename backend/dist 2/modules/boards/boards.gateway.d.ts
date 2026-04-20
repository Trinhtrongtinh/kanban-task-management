import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoardMember } from '../../database/entities';
export interface BoardMemberAddedPayload {
    boardId: string;
    member: BoardMember & {
        user?: any;
        role: string;
    };
}
export declare class BoardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinBoard(client: Socket, boardId: string): {
        event: string;
        data: {
            boardId: string;
        };
    };
    handleLeaveBoard(client: Socket, boardId: string): {
        event: string;
        data: {
            boardId: string;
        };
    };
    emitMemberAdded(boardId: string, member: BoardMember & {
        user?: any;
        role: string;
    }): void;
    emitMemberRemoved(boardId: string, userId: string): void;
}
