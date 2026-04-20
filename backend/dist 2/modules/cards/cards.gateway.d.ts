import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Card, List } from '../../database/entities';
export interface CardMovedPayload {
    card: Card;
    fromListId: string;
    toListId: string;
}
export interface ListDeletedPayload {
    id: string;
    boardId: string;
}
export declare class CardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
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
    emitCardMoved(boardId: string, payload: CardMovedPayload): void;
    emitCardCreated(boardId: string, card: Card): void;
    emitCardUpdated(boardId: string, card: Card): void;
    emitCardDeleted(boardId: string, cardId: string): void;
    emitListCreated(boardId: string, list: List): void;
    emitListUpdated(boardId: string, list: List): void;
    emitListDeleted(boardId: string, payload: ListDeletedPayload): void;
}
