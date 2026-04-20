import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Comment } from '../../database/entities';
export declare class CommentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinCard(client: Socket, cardId: string): {
        event: string;
        data: {
            cardId: string;
        };
    };
    handleLeaveCard(client: Socket, cardId: string): {
        event: string;
        data: {
            cardId: string;
        };
    };
    emitCommentCreated(cardId: string, comment: Comment): void;
    emitCommentUpdated(cardId: string, comment: Comment): void;
    emitCommentDeleted(cardId: string, commentId: string): void;
}
