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
var ActivitiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const dto_1 = require("./dto");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
let ActivitiesService = ActivitiesService_1 = class ActivitiesService {
    activityLogRepository;
    boardRepository;
    cardRepository;
    logger = new common_1.Logger(ActivitiesService_1.name);
    constructor(activityLogRepository, boardRepository, cardRepository) {
        this.activityLogRepository = activityLogRepository;
        this.boardRepository = boardRepository;
        this.cardRepository = cardRepository;
    }
    async validateBoardExists(boardId) {
        const board = await this.boardRepository.findOne({
            where: { id: boardId },
        });
        if (!board) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async validateCardExists(cardId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async logActivity(createActivityLogDto) {
        const activityLog = this.activityLogRepository.create({
            userId: createActivityLogDto.userId,
            boardId: createActivityLogDto.boardId || null,
            cardId: createActivityLogDto.cardId || null,
            action: createActivityLogDto.action,
            entityTitle: createActivityLogDto.entityTitle,
            details: createActivityLogDto.details || null,
            content: createActivityLogDto.content || createActivityLogDto.entityTitle,
        });
        return this.activityLogRepository.save(activityLog);
    }
    async createLog(createActivityLogDto) {
        return this.logActivity(createActivityLogDto);
    }
    getFilterStartDate(filter) {
        if (filter === dto_1.ActivityTimeFilter.TODAY) {
            const todayUtcStart = new Date();
            todayUtcStart.setUTCHours(0, 0, 0, 0);
            return todayUtcStart;
        }
        if (filter === dto_1.ActivityTimeFilter.WEEK) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
            return sevenDaysAgo;
        }
        return null;
    }
    async getActivities(query, userId, boardId) {
        if (!userId && !boardId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.BAD_REQUEST, 'Thiếu userId hoặc boardId để truy vấn activity');
        }
        if (boardId) {
            await this.validateBoardExists(boardId);
        }
        const startDate = this.getFilterStartDate(query.filter);
        const queryBuilder = this.activityLogRepository
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .leftJoinAndSelect('activity.board', 'board')
            .leftJoinAndSelect('activity.card', 'card')
            .orderBy('activity.createdAt', 'DESC')
            .addOrderBy('activity.id', 'DESC')
            .take(query.limit + 1);
        if (userId) {
            queryBuilder.where('activity.userId = :userId', { userId });
        }
        else if (boardId) {
            queryBuilder.where('activity.boardId = :boardId', { boardId });
        }
        if (startDate) {
            queryBuilder.andWhere('activity.createdAt >= :startDate', {
                startDate,
            });
        }
        if (query.cursor) {
            queryBuilder.andWhere('activity.createdAt < :cursor', {
                cursor: new Date(query.cursor),
            });
        }
        const activities = await queryBuilder.getMany();
        const items = activities.slice(0, query.limit);
        const nextCursor = activities.length > query.limit && items.length > 0
            ? items[items.length - 1].createdAt.toISOString()
            : null;
        return { items, nextCursor };
    }
    async findAllByBoard(boardId) {
        const result = await this.getActivities({ filter: dto_1.ActivityTimeFilter.ALL, limit: 20 }, undefined, boardId);
        return result.items;
    }
    async findAllByCard(cardId) {
        await this.validateCardExists(cardId);
        return this.activityLogRepository.find({
            where: { cardId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            select: {
                id: true,
                boardId: true,
                cardId: true,
                userId: true,
                action: true,
                content: true,
                createdAt: true,
                user: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                },
            },
        });
    }
    async findRecentByUser(userId) {
        const result = await this.getActivities({ filter: dto_1.ActivityTimeFilter.ALL, limit: 20 }, userId);
        return result.items;
    }
    async handleCronCleanup() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        const result = await this.activityLogRepository
            .createQueryBuilder()
            .delete()
            .from(entities_1.ActivityLog)
            .where('created_at < :thirtyDaysAgo', { thirtyDaysAgo })
            .execute();
        if ((result.affected ?? 0) > 0) {
            this.logger.log(`Deleted ${result.affected ?? 0} expired activity logs`);
        }
    }
};
exports.ActivitiesService = ActivitiesService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActivitiesService.prototype, "handleCronCleanup", null);
exports.ActivitiesService = ActivitiesService = ActivitiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ActivityLog)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Board)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map