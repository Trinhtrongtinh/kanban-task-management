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
exports.CardsController = void 0;
const common_1 = require("@nestjs/common");
const cards_service_1 = require("./cards.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const labels_service_1 = require("../labels/labels.service");
const checklists_service_1 = require("../checklists/checklists.service");
const dto_2 = require("../checklists/dto");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const enums_1 = require("../../common/enums");
const rate_limit_1 = require("../../common/rate-limit");
let CardsController = class CardsController {
    cardsService;
    labelsService;
    checklistsService;
    constructor(cardsService, labelsService, checklistsService) {
        this.cardsService = cardsService;
        this.labelsService = labelsService;
        this.checklistsService = checklistsService;
    }
    async create(createCardDto, userId) {
        if (!createCardDto.assigneeId) {
            createCardDto.assigneeId = userId;
        }
        return this.cardsService.create(createCardDto, userId);
    }
    async findOne(id) {
        return this.cardsService.findOne(id);
    }
    async update(id, updateCardDto, userId) {
        return this.cardsService.update(id, updateCardDto, userId);
    }
    async remove(id) {
        return this.cardsService.remove(id);
    }
    async restore(id) {
        return this.cardsService.restore(id);
    }
    async moveCard(id, moveCardDto, userId) {
        return this.cardsService.moveCard(id, moveCardDto, userId);
    }
    async addLabelToCard(cardId, labelId) {
        return this.labelsService.addLabelToCard(cardId, labelId);
    }
    async removeLabelFromCard(cardId, labelId) {
        return this.labelsService.removeLabelFromCard(cardId, labelId);
    }
    async createChecklist(cardId, createChecklistDto) {
        return this.checklistsService.createChecklist(cardId, createChecklistDto);
    }
    async findChecklistsByCard(cardId) {
        return this.checklistsService.findAllByCard(cardId);
    }
    async assignMember(cardId, userId, currentUserId) {
        return this.cardsService.addMember(cardId, userId, currentUserId);
    }
    async unassignMember(cardId, userId) {
        return this.cardsService.removeMember(cardId, userId);
    }
};
exports.CardsController = CardsController;
__decorate([
    (0, common_1.Post)(),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ListBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Card created successfully'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCardDto, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.ResponseMessage)('Card retrieved successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Card updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCardDto, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Card deleted successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Card restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "restore", null);
__decorate([
    (0, common_1.Patch)(':id/move'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Card moved successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.MoveCardDto, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "moveCard", null);
__decorate([
    (0, common_1.Post)(':cardId/labels/:labelId'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Label assigned to card successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('labelId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "addLabelToCard", null);
__decorate([
    (0, common_1.Delete)(':cardId/labels/:labelId'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Label removed from card successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('labelId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "removeLabelFromCard", null);
__decorate([
    (0, common_1.Post)(':cardId/checklists'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Checklist created successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_2.CreateChecklistDto]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "createChecklist", null);
__decorate([
    (0, common_1.Get)(':cardId/checklists'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.ResponseMessage)('Checklists retrieved successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "findChecklistsByCard", null);
__decorate([
    (0, common_1.Post)(':cardId/members'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR, enums_1.BoardRole.VIEWER),
    (0, decorators_1.ResponseMessage)('Member assigned to card successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "assignMember", null);
__decorate([
    (0, common_1.Delete)(':cardId/members/:userId'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR, enums_1.BoardRole.VIEWER),
    (0, decorators_1.ResponseMessage)('Member unassigned from card successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "unassignMember", null);
exports.CardsController = CardsController = __decorate([
    (0, common_1.Controller)('cards'),
    __metadata("design:paramtypes", [cards_service_1.CardsService,
        labels_service_1.LabelsService,
        checklists_service_1.ChecklistsService])
], CardsController);
//# sourceMappingURL=cards.controller.js.map