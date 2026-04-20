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
exports.CardsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let CardsGateway = class CardsGateway {
    server;
    handleConnection(client) {
        console.log(`Client connected to cards: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected from cards: ${client.id}`);
    }
    handleJoinBoard(client, boardId) {
        client.join(`board:${boardId}`);
        console.log(`Client ${client.id} joined room board:${boardId}`);
        return { event: 'joinedBoard', data: { boardId } };
    }
    handleLeaveBoard(client, boardId) {
        client.leave(`board:${boardId}`);
        console.log(`Client ${client.id} left room board:${boardId}`);
        return { event: 'leftBoard', data: { boardId } };
    }
    emitCardMoved(boardId, payload) {
        this.server.to(`board:${boardId}`).emit('card:moved', payload);
    }
    emitCardCreated(boardId, card) {
        this.server.to(`board:${boardId}`).emit('card:created', card);
    }
    emitCardUpdated(boardId, card) {
        this.server.to(`board:${boardId}`).emit('card:updated', card);
    }
    emitCardDeleted(boardId, cardId) {
        this.server.to(`board:${boardId}`).emit('card:deleted', { cardId });
    }
    emitListCreated(boardId, list) {
        this.server.to(`board:${boardId}`).emit('list:created', list);
    }
    emitListUpdated(boardId, list) {
        this.server.to(`board:${boardId}`).emit('list:updated', list);
    }
    emitListDeleted(boardId, payload) {
        this.server.to(`board:${boardId}`).emit('list:deleted', payload);
    }
};
exports.CardsGateway = CardsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CardsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinBoard'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CardsGateway.prototype, "handleJoinBoard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveBoard'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CardsGateway.prototype, "handleLeaveBoard", null);
exports.CardsGateway = CardsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/cards',
    })
], CardsGateway);
//# sourceMappingURL=cards.gateway.js.map