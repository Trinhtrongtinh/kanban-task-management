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
exports.BoardsController = void 0;
const common_1 = require("@nestjs/common");
const boards_service_1 = require("./boards.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const enums_1 = require("../../common/enums");
const rate_limit_1 = require("../../common/rate-limit");
let BoardsController = class BoardsController {
    boardsService;
    constructor(boardsService) {
        this.boardsService = boardsService;
    }
    async create(createBoardDto, userId) {
        return this.boardsService.create(createBoardDto, userId);
    }
    async findAllByWorkspace(workspaceId, userId, joinedOnly) {
        return this.boardsService.findAllByWorkspace(workspaceId, userId, joinedOnly === 'true');
    }
    async findDeletedByWorkspace(workspaceId) {
        return this.boardsService.findDeletedByWorkspace(workspaceId);
    }
    async findOne(id) {
        return this.boardsService.findOne(id);
    }
    async update(id, updateBoardDto, userId) {
        return this.boardsService.update(id, updateBoardDto, userId);
    }
    async remove(id) {
        return this.boardsService.remove(id);
    }
    async restore(id) {
        return this.boardsService.restore(id);
    }
    async getMembers(id) {
        return this.boardsService.getMembers(id);
    }
    async addMember(id, memberId, userId) {
        if (!memberId) {
            throw new common_1.BadRequestException('Yêu cầu phải có userId');
        }
        return this.boardsService.addMember(id, memberId, userId);
    }
    async removeMember(id, memberId, userId) {
        return this.boardsService.removeMember(id, memberId, userId);
    }
};
exports.BoardsController = BoardsController;
__decorate([
    (0, common_1.Post)(),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Board created successfully'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateBoardDto, String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('workspace/:workspaceId'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.ResponseMessage)('Boards retrieved successfully'),
    __param(0, (0, common_1.Param)('workspaceId', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Query)('joinedOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "findAllByWorkspace", null);
__decorate([
    (0, common_1.Get)('workspace/:workspaceId/deleted'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.RequireWorkspaceRole)(enums_1.WorkspaceRole.OWNER),
    (0, decorators_1.ResponseMessage)('Deleted boards retrieved successfully'),
    __param(0, (0, common_1.Param)('workspaceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "findDeletedByWorkspace", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.ResponseMessage)('Board retrieved successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN),
    (0, decorators_1.ResponseMessage)('Board updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateBoardDto, String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN),
    (0, decorators_1.ResponseMessage)('Board deleted successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN),
    (0, decorators_1.ResponseMessage)('Board restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "restore", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.ResponseMessage)('Board members retrieved successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN),
    (0, decorators_1.ResponseMessage)('Member added to board successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN),
    (0, decorators_1.ResponseMessage)('Member removed from board successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BoardsController.prototype, "removeMember", null);
exports.BoardsController = BoardsController = __decorate([
    (0, common_1.Controller)('boards'),
    __metadata("design:paramtypes", [boards_service_1.BoardsService])
], BoardsController);
//# sourceMappingURL=boards.controller.js.map