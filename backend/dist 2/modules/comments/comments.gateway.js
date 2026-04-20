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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let CommentsGateway = class CommentsGateway {
    server;
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    handleJoinCard(client, cardId) {
        client.join(`card:${cardId}`);
        console.log(`Client ${client.id} joined room card:${cardId}`);
        return { event: 'joinedCard', data: { cardId } };
    }
    handleLeaveCard(client, cardId) {
        client.leave(`card:${cardId}`);
        console.log(`Client ${client.id} left room card:${cardId}`);
        return { event: 'leftCard', data: { cardId } };
    }
    emitCommentCreated(cardId, comment) {
        this.server.to(`card:${cardId}`).emit('comment:created', comment);
    }
    emitCommentUpdated(cardId, comment) {
        this.server.to(`card:${cardId}`).emit('comment:updated', comment);
    }
    emitCommentDeleted(cardId, commentId) {
        this.server.to(`card:${cardId}`).emit('comment:deleted', { commentId });
    }
};
exports.CommentsGateway = CommentsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CommentsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinCard'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CommentsGateway.prototype, "handleJoinCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveCard'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CommentsGateway.prototype, "handleLeaveCard", null);
exports.CommentsGateway = CommentsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/comments',
    })
], CommentsGateway);
//# sourceMappingURL=comments.gateway.js.map