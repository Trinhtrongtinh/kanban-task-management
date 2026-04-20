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
exports.ListsController = void 0;
const common_1 = require("@nestjs/common");
const lists_service_1 = require("./lists.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const enums_1 = require("../../common/enums");
const rate_limit_1 = require("../../common/rate-limit");
let ListsController = class ListsController {
    listsService;
    constructor(listsService) {
        this.listsService = listsService;
    }
    async create(createListDto) {
        return this.listsService.create(createListDto);
    }
    async findAllByBoard(boardId) {
        return this.listsService.findAllByBoard(boardId);
    }
    async update(id, updateListDto) {
        return this.listsService.update(id, updateListDto);
    }
    async remove(id) {
        return this.listsService.remove(id);
    }
    async restore(id) {
        return this.listsService.restore(id);
    }
};
exports.ListsController = ListsController;
__decorate([
    (0, common_1.Post)(),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('List created successfully'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateListDto]),
    __metadata("design:returntype", Promise)
], ListsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('board/:boardId'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ListBoardGuard),
    (0, decorators_1.ResponseMessage)('Lists retrieved successfully'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ListsController.prototype, "findAllByBoard", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ListBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('List updated successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateListDto]),
    __metadata("design:returntype", Promise)
], ListsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ListBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('List deleted successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ListsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.ListBoardGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('List restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ListsController.prototype, "restore", null);
exports.ListsController = ListsController = __decorate([
    (0, common_1.Controller)('lists'),
    __metadata("design:paramtypes", [lists_service_1.ListsService])
], ListsController);
//# sourceMappingURL=lists.controller.js.map