import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/cards',
})
export class CardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to cards: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from cards: ${client.id}`);
  }

  /**
   * Join a board room to receive real-time card updates
   */
  @SubscribeMessage('joinBoard')
  handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() boardId: string,
  ) {
    client.join(`board:${boardId}`);
    console.log(`Client ${client.id} joined room board:${boardId}`);
    return { event: 'joinedBoard', data: { boardId } };
  }

  /**
   * Leave a board room
   */
  @SubscribeMessage('leaveBoard')
  handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() boardId: string,
  ) {
    client.leave(`board:${boardId}`);
    console.log(`Client ${client.id} left room board:${boardId}`);
    return { event: 'leftBoard', data: { boardId } };
  }

  /**
   * Emit card:moved event to all clients in the board room
   */
  emitCardMoved(boardId: string, payload: CardMovedPayload) {
    this.server.to(`board:${boardId}`).emit('card:moved', payload);
  }

  /**
   * Emit card:created event to all clients in the board room
   */
  emitCardCreated(boardId: string, card: Card) {
    this.server.to(`board:${boardId}`).emit('card:created', card);
  }

  /**
   * Emit card:updated event to all clients in the board room
   */
  emitCardUpdated(boardId: string, card: Card) {
    this.server.to(`board:${boardId}`).emit('card:updated', card);
  }

  /**
   * Emit card:deleted event to all clients in the board room
   */
  emitCardDeleted(boardId: string, cardId: string) {
    this.server.to(`board:${boardId}`).emit('card:deleted', { cardId });
  }

  emitListCreated(boardId: string, list: List) {
    this.server.to(`board:${boardId}`).emit('list:created', list);
  }

  emitListUpdated(boardId: string, list: List) {
    this.server.to(`board:${boardId}`).emit('list:updated', list);
  }

  emitListDeleted(boardId: string, payload: ListDeletedPayload) {
    this.server.to(`board:${boardId}`).emit('list:deleted', payload);
  }
}
