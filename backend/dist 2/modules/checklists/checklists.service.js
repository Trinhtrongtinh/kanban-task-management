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
exports.ChecklistsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const activities_service_1 = require("../activities/activities.service");
let ChecklistsService = class ChecklistsService {
    checklistRepository;
    checklistItemRepository;
    cardRepository;
    activitiesService;
    dataSource;
    constructor(checklistRepository, checklistItemRepository, cardRepository, activitiesService, dataSource) {
        this.checklistRepository = checklistRepository;
        this.checklistItemRepository = checklistItemRepository;
        this.cardRepository = cardRepository;
        this.activitiesService = activitiesService;
        this.dataSource = dataSource;
    }
    async validateCardExists(cardId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async calculateNextPosition(checklistId) {
        const lastItem = await this.checklistItemRepository.findOne({
            where: { checklistId },
            order: { position: 'DESC' },
        });
        if (!lastItem) {
            return 1;
        }
        return lastItem.position + 1;
    }
    async createChecklist(cardId, createChecklistDto) {
        const { title } = createChecklistDto;
        await this.validateCardExists(cardId);
        const checklist = this.checklistRepository.create({
            cardId,
            title,
        });
        return this.checklistRepository.save(checklist);
    }
    async findAllByCard(cardId) {
        await this.validateCardExists(cardId);
        return this.checklistRepository.find({
            where: { cardId },
            relations: ['items'],
            order: { items: { position: 'ASC' } },
        });
    }
    async findOneChecklist(id) {
        const checklist = await this.checklistRepository.findOne({
            where: { id },
            relations: ['items'],
            order: { items: { position: 'ASC' } },
        });
        if (!checklist) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CHECKLIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return checklist;
    }
    async removeChecklist(id) {
        const checklist = await this.findOneChecklist(id);
        await this.dataSource.transaction(async (manager) => {
            await manager.softDelete(entities_1.ChecklistItem, { checklistId: checklist.id });
            await manager.softDelete(entities_1.Checklist, { id: checklist.id });
        });
    }
    async restoreChecklist(id) {
        const checklist = await this.checklistRepository.findOne({
            where: { id },
            withDeleted: true,
            relations: ['items'],
        });
        if (!checklist) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CHECKLIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!checklist.deletedAt) {
            return this.findOneChecklist(id);
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.restore(entities_1.Checklist, { id });
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.ChecklistItem)
                .where('checklist_id = :checklistId', { checklistId: id })
                .execute();
        });
        return this.findOneChecklist(id);
    }
    async updateChecklist(id, updateChecklistDto) {
        const checklist = await this.findOneChecklist(id);
        Object.assign(checklist, updateChecklistDto);
        return this.checklistRepository.save(checklist);
    }
    async createChecklistItem(createChecklistItemDto) {
        const { checklistId, content } = createChecklistItemDto;
        await this.findOneChecklist(checklistId);
        const position = await this.calculateNextPosition(checklistId);
        const item = this.checklistItemRepository.create({
            checklistId,
            content,
            position,
            isDone: false,
        });
        return this.checklistItemRepository.save(item);
    }
    async findOneChecklistItem(id) {
        const item = await this.checklistItemRepository.findOne({
            where: { id },
        });
        if (!item) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CHECKLIST_ITEM_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return item;
    }
    async updateChecklistItem(id, updateChecklistItemDto, userId) {
        const item = await this.findOneChecklistItem(id);
        const wasCompleted = item.isDone;
        Object.assign(item, updateChecklistItemDto);
        const updatedItem = await this.checklistItemRepository.save(item);
        if (!wasCompleted && updatedItem.isDone && userId) {
            const checklist = await this.checklistRepository.findOne({
                where: { id: item.checklistId },
                relations: ['items', 'card', 'card.list'],
            });
            if (checklist && checklist.card) {
                const allItems = checklist.items || [];
                const allDone = allItems.every((i) => i.isDone);
                if (allDone && allItems.length > 0) {
                    this.activitiesService
                        .createLog({
                        userId,
                        boardId: checklist.card.list.boardId,
                        cardId: checklist.cardId,
                        action: enums_1.ActivityAction.CHECKLIST_COMPLETED,
                        entityTitle: checklist.title,
                        details: {
                            cardTitle: checklist.card.title,
                        },
                        content: `Đã hoàn thành checklist "${checklist.title}" trong thẻ "${checklist.card.title}"`,
                    })
                        .catch((err) => console.error('Failed to log checklist completion:', err));
                }
            }
        }
        return updatedItem;
    }
    async removeChecklistItem(id) {
        const item = await this.findOneChecklistItem(id);
        await this.checklistItemRepository.softDelete(item.id);
    }
    async restoreChecklistItem(id) {
        const item = await this.checklistItemRepository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!item) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CHECKLIST_ITEM_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!item.deletedAt) {
            return item;
        }
        await this.checklistItemRepository.restore(item.id);
        const restored = await this.checklistItemRepository.findOne({ where: { id } });
        if (!restored) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CHECKLIST_ITEM_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return restored;
    }
    async bulkCreateChecklistItems(checklistId, bulkCreateDto) {
        await this.findOneChecklist(checklistId);
        const { items } = bulkCreateDto;
        return this.dataSource.transaction(async (manager) => {
            const checklistItems = items.map((item) => manager.create(entities_1.ChecklistItem, {
                checklistId,
                content: item.content,
                position: item.position,
                isDone: false,
            }));
            return manager.save(entities_1.ChecklistItem, checklistItems);
        });
    }
    async bulkDeleteChecklistItems(bulkDeleteDto) {
        const { ids } = bulkDeleteDto;
        return this.dataSource.transaction(async (manager) => {
            const existingItems = await manager.find(entities_1.ChecklistItem, {
                where: { id: (0, typeorm_2.In)(ids) },
                select: ['id'],
            });
            if (existingItems.length !== ids.length) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.CHECKLIST_ITEM_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
            }
            const result = await manager.delete(entities_1.ChecklistItem, { id: (0, typeorm_2.In)(ids) });
            return { deletedCount: result.affected ?? 0 };
        });
    }
};
exports.ChecklistsService = ChecklistsService;
exports.ChecklistsService = ChecklistsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Checklist)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ChecklistItem)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        activities_service_1.ActivitiesService,
        typeorm_2.DataSource])
], ChecklistsService);
//# sourceMappingURL=checklists.service.js.map