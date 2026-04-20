"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let NotificationsGateway = class NotificationsGateway {
    server;
    logger = new common_1.Logger('NotificationsGateway');
    userSockets = new Map();
    afterInit() {
        this.logger.log('Notifications WebSocket Gateway initialized');
    }
    handleConnection(client) {
        const userId = client.handshake.query.userId;
        if (userId) {
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)?.add(client.id);
            client.join(`user:${userId}`);
            this.logger.log(`User ${userId} connected with socket ${client.id}`);
        }
    }
    handleDisconnect(client) {
        const userId = client.handshake.query.userId;
        if (userId) {
            this.userSockets.get(userId)?.delete(client.id);
            if (this.userSockets.get(userId)?.size === 0) {
                this.userSockets.delete(userId);
            }
            this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
        }
    }
    isUserOnline(userId) {
        return (this.userSockets.has(userId) &&
            (this.userSockets.get(userId)?.size ?? 0) > 0);
    }
    emitNotification(userId, notification) {
        this.server.to(`user:${userId}`).emit('new_notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
        });
        this.logger.log(`Notification emitted to user ${userId}`);
    }
    emitNotificationRead(userId, notificationId) {
        this.server.to(`user:${userId}`).emit('notification_read', {
            notificationId,
        });
    }
    emitAllNotificationsRead(userId) {
        this.server.to(`user:${userId}`).emit('all_notifications_read');
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: 'notifications',
    })
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map