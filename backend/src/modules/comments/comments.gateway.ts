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
import { Comment } from '../../database/entities';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/comments',
})
export class CommentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join a card room to receive real-time comment updates
   */
  @SubscribeMessage('joinCard')
  handleJoinCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() cardId: string,
  ) {
    client.join(`card:${cardId}`);
    console.log(`Client ${client.id} joined room card:${cardId}`);
    return { event: 'joinedCard', data: { cardId } };
  }

  /**
   * Leave a card room
   */
  @SubscribeMessage('leaveCard')
  handleLeaveCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() cardId: string,
  ) {
    client.leave(`card:${cardId}`);
    console.log(`Client ${client.id} left room card:${cardId}`);
    return { event: 'leftCard', data: { cardId } };
  }

  /**
   * Emit comment:created event to all clients in the card room
   */
  emitCommentCreated(cardId: string, comment: Comment) {
    this.server.to(`card:${cardId}`).emit('comment:created', comment);
  }

  /**
   * Emit comment:updated event to all clients in the card room
   */
  emitCommentUpdated(cardId: string, comment: Comment) {
    this.server.to(`card:${cardId}`).emit('comment:updated', comment);
  }

  /**
   * Emit comment:deleted event to all clients in the card room
   */
  emitCommentDeleted(cardId: string, commentId: string) {
    this.server.to(`card:${cardId}`).emit('comment:deleted', { commentId });
  }
}
