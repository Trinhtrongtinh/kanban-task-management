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
exports.ChecklistsController = void 0;
const common_1 = require("@nestjs/common");
const checklists_service_1 = require("./checklists.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const enums_1 = require("../../common/enums");
const rate_limit_1 = require("../../common/rate-limit");
let ChecklistsController = class ChecklistsController {
    checklistsService;
    constructor(checklistsService) {
        this.checklistsService = checklistsService;
    }
    async updateChecklist(id, updateChecklistDto) {
        return this.checklistsService.updateChecklist(id, updateChecklistDto);
    }
    async removeChecklist(id) {
        return this.checklistsService.removeChecklist(id);
    }
    async restoreChecklist(id) {
        return this.checklistsService.restoreChecklist(id);
    }
    async createChecklistItem(checklistId, createChecklistItemDto) {
        return this.checklistsService.createChecklistItem({
            ...createChecklistItemDto,
            checklistId,
        });
    }
    async updateChecklistItem(id, updateChecklistItemDto, userId) {
        return this.checklistsService.updateChecklistItem(id, updateChecklistItemDto, userId);
    }
    async removeChecklistItem(id) {
        return this.checklistsService.removeChecklistItem(id);
    }
    async restoreChecklistItem(id) {
        return this.checklistsService.restoreChecklistItem(id);
    }
};
exports.ChecklistsController = ChecklistsController;
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateChecklistDto]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "updateChecklist", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist deleted successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "removeChecklist", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "restoreChecklist", null);
__decorate([
    (0, common_1.Post)(':checklistId/items'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist item created successfully'),
    __param(0, (0, common_1.Param)('checklistId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateChecklistItemDto]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "createChecklistItem", null);
__decorate([
    (0, common_1.Patch)('items/:id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist item updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateChecklistItemDto, String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "updateChecklistItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Đã xóa mục thành công'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "removeChecklistItem", null);
__decorate([
    (0, common_1.Patch)('items/:id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ChecklistBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist item restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "restoreChecklistItem", null);
exports.ChecklistsController = ChecklistsController = __decorate([
    (0, common_1.Controller)('checklists'),
    __metadata("design:paramtypes", [checklists_service_1.ChecklistsService])
], ChecklistsController);
//# sourceMappingURL=checklists.controller.js.map