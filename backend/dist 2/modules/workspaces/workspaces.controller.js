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
exports.WorkspacesController = void 0;
const common_1 = require("@nestjs/common");
const workspaces_service_1 = require("./workspaces.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const enums_1 = require("../../common/enums");
const rate_limit_1 = require("../../common/rate-limit");
let WorkspacesController = class WorkspacesController {
    workspacesService;
    constructor(workspacesService) {
        this.workspacesService = workspacesService;
    }
    async create(createWorkspaceDto, userId) {
        return this.workspacesService.create(createWorkspaceDto, userId);
    }
    async findAll(userId) {
        return this.workspacesService.findAllByUser(userId);
    }
    async findDeletedOwned(userId) {
        return this.workspacesService.findDeletedOwnedByUser(userId);
    }
    async findOne(id) {
        return this.workspacesService.findOne(id);
    }
    async update(id, updateWorkspaceDto) {
        return this.workspacesService.update(id, updateWorkspaceDto);
    }
    async remove(id, requesterId) {
        return this.workspacesService.remove(id, requesterId);
    }
    async restore(id, requesterId) {
        return this.workspacesService.restore(id, requesterId);
    }
    async inviteMember(workspaceId, inviteMemberDto, userId) {
        return this.workspacesService.inviteMember(workspaceId, inviteMemberDto, userId);
    }
    async acceptInvitation(workspaceId, token, userId) {
        return this.workspacesService.acceptInvitation(workspaceId, token, userId);
    }
    async getMembers(workspaceId) {
        return this.workspacesService.getMembers(workspaceId);
    }
    async removeMember(workspaceId, memberId, requesterId) {
        return this.workspacesService.removeMember(workspaceId, memberId, requesterId);
    }
};
exports.WorkspacesController = WorkspacesController;
__decorate([
    (0, common_1.Post)(),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Workspace created successfully'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateWorkspaceDto, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Workspaces retrieved successfully'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('deleted/owned'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Deleted workspaces retrieved successfully'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "findDeletedOwned", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.ResponseMessage)('Workspace retrieved successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.RequireWorkspaceRole)(enums_1.WorkspaceRole.OWNER),
    (0, decorators_1.ResponseMessage)('Workspace updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateWorkspaceDto]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.RequireWorkspaceRole)(enums_1.WorkspaceRole.OWNER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.RequireWorkspaceRole)(enums_1.WorkspaceRole.OWNER),
    (0, decorators_1.ResponseMessage)('Workspace restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.RequireWorkspaceRole)(enums_1.WorkspaceRole.OWNER, enums_1.WorkspaceRole.ADMIN),
    (0, decorators_1.ResponseMessage)('Lời mời đã được gửi thành công'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.InviteMemberDto, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Get)(':id/accept-invite'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Bạn đã tham gia workspace thành công'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('token')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.ResponseMessage)('Members retrieved successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.WorkspaceMemberGuard),
    (0, decorators_1.RequireWorkspaceRole)(enums_1.WorkspaceRole.OWNER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "removeMember", null);
exports.WorkspacesController = WorkspacesController = __decorate([
    (0, common_1.Controller)('workspaces'),
    __metadata("design:paramtypes", [workspaces_service_1.WorkspacesService])
], WorkspacesController);
//# sourceMappingURL=workspaces.controller.js.map