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
exports.ChecklistBoardGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const enums_1 = require("../enums");
const decorators_1 = require("../decorators");
let ChecklistBoardGuard = class ChecklistBoardGuard {
    reflector;
    boardMemberRepository;
    checklistRepository;
    checklistItemRepository;
    cardRepository;
    boardRepository;
    constructor(reflector, boardMemberRepository, checklistRepository, checklistItemRepository, cardRepository, boardRepository) {
        this.reflector = reflector;
        this.boardMemberRepository = boardMemberRepository;
        this.checklistRepository = checklistRepository;
        this.checklistItemRepository = checklistItemRepository;
        this.cardRepository = cardRepository;
        this.boardRepository = boardRepository;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(decorators_1.BOARD_ROLES_KEY, [context.getHandler(), context.getClass()]);
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        if (!userId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const checklistIdFromParams = request.params.checklistId;
        let checklistId;
        if (checklistIdFromParams) {
            checklistId = checklistIdFromParams;
        }
        else if (request.route?.path?.includes('/items/') || request.route?.path?.includes('items/')) {
            const itemId = request.params.id;
            if (!itemId) {
                return true;
            }
            const item = await this.checklistItemRepository.findOne({
                where: { id: itemId },
                withDeleted: true,
            });
            if (!item) {
                throw new common_1.NotFoundException('Checklist item not found');
            }
            checklistId = item.checklistId;
        }
        else {
            checklistId = request.params.id;
        }
        if (!checklistId) {
            return true;
        }
        const checklist = await this.checklistRepository.findOne({
            where: { id: checklistId },
            withDeleted: true,
        });
        if (!checklist) {
            throw new common_1.NotFoundException('Checklist not found');
        }
        const card = await this.cardRepository.findOne({
            where: { id: checklist.cardId },
            relations: ['list'],
        });
        if (!card) {
            throw new common_1.NotFoundException('Card not found');
        }
        const boardId = card.list.boardId;
        const board = await this.boardRepository.findOne({
            where: { id: boardId },
            relations: ['workspace'],
        });
        if (board && board.workspace?.ownerId === userId) {
            request.boardMembership = { userId, boardId, role: enums_1.BoardRole.ADMIN };
            return true;
        }
        const membership = await this.boardMemberRepository.findOne({
            where: { boardId, userId },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this board');
        }
        request.boardMembership = membership;
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        if (!requiredRoles.includes(membership.role)) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
};
exports.ChecklistBoardGuard = ChecklistBoardGuard;
exports.ChecklistBoardGuard = ChecklistBoardGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.BoardMember)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Checklist)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.ChecklistItem)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Board)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ChecklistBoardGuard);
//# sourceMappingURL=checklist-board.guard.js.map