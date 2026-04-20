"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const workspaces_controller_1 = require("./workspaces.controller");
const workspaces_service_1 = require("./workspaces.service");
const entities_1 = require("../../database/entities");
const common_module_1 = require("../../common/common.module");
const users_module_1 = require("../users/users.module");
const notifications_module_1 = require("../notifications/notifications.module");
let WorkspacesModule = class WorkspacesModule {
};
exports.WorkspacesModule = WorkspacesModule;
exports.WorkspacesModule = WorkspacesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.Workspace,
                entities_1.WorkspaceMember,
                entities_1.User,
                entities_1.Board,
                entities_1.List,
                entities_1.Card,
                entities_1.Attachment,
            ]),
            common_module_1.CommonModule,
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [workspaces_controller_1.WorkspacesController],
        providers: [workspaces_service_1.WorkspacesService],
        exports: [workspaces_service_1.WorkspacesService],
    })
], WorkspacesModule);
//# sourceMappingURL=workspaces.module.js.map