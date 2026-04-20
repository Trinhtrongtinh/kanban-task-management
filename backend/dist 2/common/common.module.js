"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../database/entities");
const cache_1 = require("./cache");
const guards_1 = require("./guards");
const rate_limit_1 = require("./rate-limit");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.BoardMember,
                entities_1.Board,
                entities_1.WorkspaceMember,
                entities_1.Card,
                entities_1.Checklist,
                entities_1.ChecklistItem,
                entities_1.Attachment,
                entities_1.List,
                entities_1.Workspace,
            ]),
        ],
        providers: [
            cache_1.AppCacheService,
            guards_1.AttachmentBoardGuard,
            rate_limit_1.AppThrottlerGuard,
            guards_1.BoardMemberGuard,
            guards_1.CardBoardGuard,
            guards_1.ChecklistBoardGuard,
            guards_1.ListBoardGuard,
            rate_limit_1.RedisThrottlerStorage,
            guards_1.WorkspaceMemberGuard,
        ],
        exports: [
            cache_1.AppCacheService,
            guards_1.AttachmentBoardGuard,
            rate_limit_1.AppThrottlerGuard,
            guards_1.BoardMemberGuard,
            guards_1.CardBoardGuard,
            guards_1.ChecklistBoardGuard,
            guards_1.ListBoardGuard,
            rate_limit_1.RedisThrottlerStorage,
            guards_1.WorkspaceMemberGuard,
            typeorm_1.TypeOrmModule,
        ],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map