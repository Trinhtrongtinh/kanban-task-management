"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_2 = require("./config");
const cache_manager_ioredis_yet_1 = require("cache-manager-ioredis-yet");
const entities_1 = require("./database/entities");
const users_1 = require("./modules/users");
const auth_1 = require("./modules/auth");
const workspaces_1 = require("./modules/workspaces");
const boards_1 = require("./modules/boards");
const lists_1 = require("./modules/lists");
const cards_1 = require("./modules/cards");
const labels_1 = require("./modules/labels");
const checklists_1 = require("./modules/checklists");
const attachments_1 = require("./modules/attachments");
const comments_1 = require("./modules/comments");
const activities_1 = require("./modules/activities");
const search_1 = require("./modules/search");
const notifications_1 = require("./modules/notifications");
const payments_1 = require("./modules/payments");
const common_module_1 = require("./common/common.module");
const rate_limit_1 = require("./common/rate-limit");
const guards_1 = require("./common/guards");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [
                    config_2.appConfig,
                    config_2.authConfig,
                    config_2.databaseConfig,
                    config_2.googleConfig,
                    config_2.jwtConfig,
                    config_2.mailConfig,
                    config_2.rateLimitConfig,
                    config_2.redisConfig,
                    config_2.stripeConfig,
                ],
                envFilePath: ['.env', 'backend/.env'],
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule, common_module_1.CommonModule],
                inject: [config_2.rateLimitConfig.KEY, rate_limit_1.RedisThrottlerStorage],
                useFactory: (rateLimit, storage) => ({
                    storage,
                    errorMessage: 'Too many requests. Please try again later.',
                    throttlers: [
                        {
                            name: 'default',
                            ttl: rateLimit.default.ttlMs,
                            limit: (context) => {
                                const request = context.switchToHttp().getRequest();
                                return request.user?.userId
                                    ? rateLimit.default.limitAuthenticated
                                    : rateLimit.default.limitAnonymous;
                            },
                            blockDuration: rateLimit.default.blockDurationMs,
                        },
                        {
                            name: 'auth',
                            ttl: rateLimit.auth.ttlMs,
                            limit: rateLimit.auth.limit,
                            blockDuration: rateLimit.auth.blockDurationMs,
                        },
                        {
                            name: 'search',
                            ttl: rateLimit.search.ttlMs,
                            limit: rateLimit.search.limit,
                            blockDuration: rateLimit.search.blockDurationMs,
                        },
                        {
                            name: 'upload',
                            ttl: rateLimit.upload.ttlMs,
                            limit: rateLimit.upload.limit,
                            blockDuration: rateLimit.upload.blockDurationMs,
                        },
                        {
                            name: 'write',
                            ttl: rateLimit.write.ttlMs,
                            limit: rateLimit.write.limit,
                            blockDuration: rateLimit.write.blockDurationMs,
                        },
                        {
                            name: 'dangerous',
                            ttl: rateLimit.dangerous.ttlMs,
                            limit: rateLimit.dangerous.limit,
                            blockDuration: rateLimit.dangerous.blockDurationMs,
                        },
                        {
                            name: 'notificationBulk',
                            ttl: rateLimit.notificationBulk.ttlMs,
                            limit: rateLimit.notificationBulk.limit,
                            blockDuration: rateLimit.notificationBulk.blockDurationMs,
                        },
                        {
                            name: 'payments',
                            ttl: rateLimit.payments.ttlMs,
                            limit: rateLimit.payments.limit,
                            blockDuration: rateLimit.payments.blockDurationMs,
                        },
                        {
                            name: 'read',
                            ttl: rateLimit.read.ttlMs,
                            limit: (context) => {
                                const request = context.switchToHttp().getRequest();
                                return request.user?.userId
                                    ? rateLimit.read.limitAuthenticated
                                    : rateLimit.read.limitAnonymous;
                            },
                            blockDuration: rateLimit.read.blockDurationMs,
                        },
                    ],
                }),
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                imports: [config_1.ConfigModule],
                inject: [config_2.redisConfig.KEY],
                useFactory: async (redis) => ({
                    store: await (0, cache_manager_ioredis_yet_1.redisStore)({
                        host: redis.host,
                        port: redis.port,
                        password: redis.password,
                        ttl: 60,
                    }),
                }),
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_2.databaseConfig.KEY],
                useFactory: (database) => ({
                    type: 'mysql',
                    host: database.host,
                    port: database.port,
                    username: database.username,
                    password: database.password,
                    database: database.database,
                    entities: [
                        entities_1.User,
                        entities_1.Workspace,
                        entities_1.WorkspaceMember,
                        entities_1.Board,
                        entities_1.BoardMember,
                        entities_1.List,
                        entities_1.Card,
                        entities_1.Label,
                        entities_1.Checklist,
                        entities_1.ChecklistItem,
                        entities_1.Attachment,
                        entities_1.Comment,
                        entities_1.ActivityLog,
                        entities_1.Notification,
                    ],
                    synchronize: database.synchronize,
                    logging: database.logging,
                    ssl: database.ssl
                        ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
                        : false,
                }),
            }),
            users_1.UsersModule,
            auth_1.AuthModule,
            workspaces_1.WorkspacesModule,
            boards_1.BoardsModule,
            lists_1.ListsModule,
            cards_1.CardsModule,
            labels_1.LabelsModule,
            checklists_1.ChecklistsModule,
            attachments_1.AttachmentsModule,
            comments_1.CommentsModule,
            activities_1.ActivitiesModule,
            search_1.SearchModule,
            notifications_1.NotificationsModule,
            payments_1.PaymentsModule,
            common_module_1.CommonModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: rate_limit_1.AppThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.CsrfCookieGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map