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
exports.LabelsController = void 0;
const common_1 = require("@nestjs/common");
const labels_service_1 = require("./labels.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const enums_1 = require("../../common/enums");
const rate_limit_1 = require("../../common/rate-limit");
let LabelsController = class LabelsController {
    labelsService;
    constructor(labelsService) {
        this.labelsService = labelsService;
    }
    async create(createLabelDto) {
        return this.labelsService.create(createLabelDto);
    }
    async findAllByBoard(boardId) {
        return this.labelsService.findAllByBoard(boardId);
    }
};
exports.LabelsController = LabelsController;
__decorate([
    (0, common_1.Post)('labels'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Label created successfully'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateLabelDto]),
    __metadata("design:returntype", Promise)
], LabelsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('labels/board/:boardId'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.ResponseMessage)('Labels retrieved successfully'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LabelsController.prototype, "findAllByBoard", null);
exports.LabelsController = LabelsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [labels_service_1.LabelsService])
], LabelsController);
//# sourceMappingURL=labels.controller.js.map