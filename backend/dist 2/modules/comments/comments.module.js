"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const comments_controller_1 = require("./comments.controller");
const comments_service_1 = require("./comments.service");
const comments_gateway_1 = require("./comments.gateway");
const entities_1 = require("../../database/entities");
const activities_module_1 = require("../activities/activities.module");
const notifications_module_1 = require("../notifications/notifications.module");
const common_module_1 = require("../../common/common.module");
let CommentsModule = class CommentsModule {
};
exports.CommentsModule = CommentsModule;
exports.CommentsModule = CommentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.Comment, entities_1.Card, entities_1.BoardMember]),
            activities_module_1.ActivitiesModule,
            notifications_module_1.NotificationsModule,
            common_module_1.CommonModule,
        ],
        controllers: [comments_controller_1.CommentsController],
        providers: [comments_service_1.CommentsService, comments_gateway_1.CommentsGateway],
        exports: [comments_service_1.CommentsService, comments_gateway_1.CommentsGateway],
    })
], CommentsModule);
//# sourceMappingURL=comments.module.js.map