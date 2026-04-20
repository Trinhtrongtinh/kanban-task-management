"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const notifications_controller_1 = require("./notifications.controller");
const notifications_service_1 = require("./notifications.service");
const notifications_gateway_1 = require("./notifications.gateway");
const deadline_reminder_service_1 = require("./deadline-reminder.service");
const mailer_service_1 = require("./mailer.service");
const entities_1 = require("../../database/entities");
const common_module_1 = require("../../common/common.module");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.Notification, entities_1.Card, entities_1.User]),
            schedule_1.ScheduleModule.forRoot(),
            common_module_1.CommonModule,
        ],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [
            notifications_service_1.NotificationsService,
            notifications_gateway_1.NotificationsGateway,
            deadline_reminder_service_1.DeadlineReminderService,
            mailer_service_1.MailerService,
        ],
        exports: [notifications_service_1.NotificationsService, notifications_gateway_1.NotificationsGateway, mailer_service_1.MailerService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map