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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common");
const comments_service_1 = require("./comments.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const rate_limit_1 = require("../../common/rate-limit");
let CommentsController = class CommentsController {
    commentsService;
    constructor(commentsService) {
        this.commentsService = commentsService;
    }
    async create(cardId, createCommentDto, userId) {
        return this.commentsService.create(cardId, createCommentDto, userId);
    }
    async findAllByCard(cardId) {
        return this.commentsService.findAllByCard(cardId);
    }
    async update(id, updateCommentDto, userId) {
        return this.commentsService.update(id, updateCommentDto, userId);
    }
    async remove(id, userId) {
        return this.commentsService.remove(id, userId);
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Post)('cards/:cardId/comments'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.ResponseMessage)('Comment created successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCommentDto, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('cards/:cardId/comments'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.ResponseMessage)('Comments retrieved successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findAllByCard", null);
__decorate([
    (0, common_1.Patch)('comments/:id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Comment updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCommentDto, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('comments/:id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Comment deleted successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "remove", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [comments_service_1.CommentsService])
], CommentsController);
//# sourceMappingURL=comments.controller.js.map