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
exports.BoardsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let BoardsGateway = class BoardsGateway {
    server;
    logger = new common_1.Logger('BoardsGateway');
    handleConnection(client) {
        this.logger.log(`Client connected to boards: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from boards: ${client.id}`);
    }
    handleJoinBoard(client, boardId) {
        client.join(`board:${boardId}`);
        this.logger.log(`Client ${client.id} joined room board:${boardId}`);
        return { event: 'joinedBoard', data: { boardId } };
    }
    handleLeaveBoard(client, boardId) {
        client.leave(`board:${boardId}`);
        this.logger.log(`Client ${client.id} left room board:${boardId}`);
        return { event: 'leftBoard', data: { boardId } };
    }
    emitMemberAdded(boardId, member) {
        this.server.to(`board:${boardId}`).emit('member:added', {
            boardId,
            member: {
                id: member.id,
                userId: member.userId,
                boardId: member.boardId,
                role: member.role,
                user: member.user ? {
                    id: member.user.id,
                    username: member.user.username,
                    email: member.user.email,
                    avatarUrl: member.user.avatarUrl,
                } : null,
            },
        });
        this.logger.log(`Member added event emitted for board ${boardId}`);
    }
    emitMemberRemoved(boardId, userId) {
        this.server.to(`board:${boardId}`).emit('member:removed', {
            boardId,
            userId,
        });
        this.logger.log(`Member removed event emitted for board ${boardId}`);
    }
};
exports.BoardsGateway = BoardsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BoardsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinBoard'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], BoardsGateway.prototype, "handleJoinBoard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveBoard'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], BoardsGateway.prototype, "handleLeaveBoard", null);
exports.BoardsGateway = BoardsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/boards',
    })
], BoardsGateway);
//# sourceMappingURL=boards.gateway.js.map