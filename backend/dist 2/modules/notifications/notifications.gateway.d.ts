import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Notification } from '../../database/entities';
export declare class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    private userSockets;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    isUserOnline(userId: string): boolean;
    emitNotification(userId: string, notification: Notification): void;
    emitNotificationRead(userId: string, notificationId: string): void;
    emitAllNotificationsRead(userId: string): void;
}
