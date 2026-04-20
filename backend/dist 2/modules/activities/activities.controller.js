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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const activities_service_1 = require("./activities.service");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const dto_1 = require("./dto");
const rate_limit_1 = require("../../common/rate-limit");
let ActivitiesController = class ActivitiesController {
    activitiesService;
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    findRecentByUser(userId, query) {
        return this.activitiesService.getActivities(query, userId);
    }
    findBoardActivities(boardId, query) {
        return this.activitiesService.getActivities(query, undefined, boardId);
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Get)('activities/me'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('User activities retrieved successfully'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.GetActivitiesQueryDto]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findRecentByUser", null);
__decorate([
    (0, common_1.Get)('boards/:boardId/activities'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.BoardMemberGuard),
    (0, decorators_1.ResponseMessage)('Board activities retrieved successfully'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.GetActivitiesQueryDto]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findBoardActivities", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map