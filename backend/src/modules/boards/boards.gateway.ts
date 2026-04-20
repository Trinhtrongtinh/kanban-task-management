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
import { Logger } from '@nestjs/common';
import { BoardMember } from '../../database/entities';

export interface BoardMemberAddedPayload {
  boardId: string;
  member: BoardMember & { user?: any; role: string };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/boards',
})
export class BoardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('BoardsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to boards: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from boards: ${client.id}`);
  }

  /**
   * Join a board room to receive real-time board updates
   */
  @SubscribeMessage('joinBoard')
  handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() boardId: string,
  ) {
    client.join(`board:${boardId}`);
    this.logger.log(`Client ${client.id} joined room board:${boardId}`);
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
    this.logger.log(`Client ${client.id} left room board:${boardId}`);
    return { event: 'leftBoard', data: { boardId } };
  }

  /**
   * Emit member:added event to all clients in the board room
   */
  emitMemberAdded(
    boardId: string,
    member: BoardMember & { user?: any; role: string },
  ) {
    this.server.to(`board:${boardId}`).emit('member:added', {
      boardId,
      member: {
        id: member.id,
        userId: member.userId,
        boardId: member.boardId,
        role: member.role,
        user: member.user
          ? {
              id: member.user.id,
              username: member.user.username,
              email: member.user.email,
              avatarUrl: member.user.avatarUrl,
            }
          : null,
      },
    });
    this.logger.log(`Member added event emitted for board ${boardId}`);
  }

  /**
   * Emit member:removed event to all clients in the board room
   */
  emitMemberRemoved(boardId: string, userId: string) {
    this.server.to(`board:${boardId}`).emit('member:removed', {
      boardId,
      userId,
    });
    this.logger.log(`Member removed event emitted for board ${boardId}`);
  }
}
