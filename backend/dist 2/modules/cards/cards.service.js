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
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const activities_service_1 = require("../activities/activities.service");
const cards_gateway_1 = require("./cards.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const POSITION_GAP = 65535;
let CardsService = class CardsService {
    cardRepository;
    listRepository;
    boardMemberRepository;
    dataSource;
    activitiesService;
    cardsGateway;
    notificationsService;
    constructor(cardRepository, listRepository, boardMemberRepository, dataSource, activitiesService, cardsGateway, notificationsService) {
        this.cardRepository = cardRepository;
        this.listRepository = listRepository;
        this.boardMemberRepository = boardMemberRepository;
        this.dataSource = dataSource;
        this.activitiesService = activitiesService;
        this.cardsGateway = cardsGateway;
        this.notificationsService = notificationsService;
    }
    async validateAssigneeInBoard(listId, userId) {
        const list = await this.listRepository.findOne({
            where: { id: listId },
            relations: ['board'],
        });
        if (!list) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        const boardMember = await this.boardMemberRepository.findOne({
            where: { boardId: list.boardId, userId },
        });
        if (!boardMember) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.FORBIDDEN, 'Người được gán phải là thành viên của board');
        }
    }
    async validateMemberInBoard(listId, userId) {
        await this.validateAssigneeInBoard(listId, userId);
    }
    async validateListExists(listId) {
        const list = await this.listRepository.findOne({
            where: { id: listId },
        });
        if (!list) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async calculateNewPosition(listId) {
        const lastCard = await this.cardRepository.findOne({
            where: { listId },
            order: { position: 'DESC' },
        });
        if (!lastCard) {
            return POSITION_GAP;
        }
        return lastCard.position + POSITION_GAP;
    }
    async create(createCardDto, userId) {
        const { title, listId, deadline, assigneeId, ...rest } = createCardDto;
        await this.validateListExists(listId);
        const position = await this.calculateNewPosition(listId);
        if (assigneeId) {
            await this.validateAssigneeInBoard(listId, assigneeId);
        }
        const card = this.cardRepository.create({
            title,
            listId,
            position,
            deadline: deadline ? new Date(deadline) : null,
            assigneeId: assigneeId || null,
            ...rest,
        });
        const savedCard = await this.cardRepository.save(card);
        if (assigneeId) {
            await this.cardRepository
                .createQueryBuilder()
                .relation(entities_1.Card, 'members')
                .of(savedCard.id)
                .add(assigneeId);
        }
        const fullCard = await this.findOne(savedCard.id);
        const boardId = fullCard.list.boardId;
        this.cardsGateway.emitCardCreated(boardId, fullCard);
        this.activitiesService
            .createLog({
            userId,
            boardId,
            cardId: savedCard.id,
            action: enums_1.ActivityAction.CREATE_CARD,
            entityTitle: savedCard.title,
            content: `Đã tạo thẻ "${savedCard.title}"`,
        })
            .catch((err) => console.error('Failed to log card creation:', err));
        return fullCard;
    }
    async findAllByList(listId) {
        await this.validateListExists(listId);
        return this.cardRepository.find({
            where: { listId, isArchived: false },
            relations: ['labels', 'attachments', 'assignee', 'members'],
            order: { position: 'ASC' },
        });
    }
    async findOne(id) {
        const card = await this.cardRepository.findOne({
            where: { id },
            relations: ['list', 'labels', 'attachments', 'assignee', 'members'],
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return card;
    }
    async update(id, updateCardDto, userId) {
        const card = await this.findOne(id);
        const previousAssigneeId = card.assigneeId;
        const { listId, deadline, ...rest } = updateCardDto;
        const targetListId = listId || card.listId;
        if (listId && listId !== card.listId) {
            await this.validateListExists(listId);
            card.listId = listId;
            if (!updateCardDto.position) {
                card.position = await this.calculateNewPosition(listId);
            }
        }
        if (deadline !== undefined) {
            card.deadline = deadline ? new Date(deadline) : null;
        }
        if (rest.assigneeId !== undefined && rest.assigneeId !== null) {
            await this.validateAssigneeInBoard(targetListId, rest.assigneeId);
        }
        Object.assign(card, rest);
        if (rest.assigneeId !== undefined) {
            if (rest.assigneeId === null) {
                card.members = (card.members || []).filter((m) => m.id !== previousAssigneeId);
            }
            else {
                const existed = (card.members || []).some((m) => m.id === rest.assigneeId);
                if (!existed) {
                    const user = await this.cardRepository.manager.findOne(entities_1.User, {
                        where: { id: rest.assigneeId },
                    });
                    if (user) {
                        card.members = [...(card.members || []), user];
                    }
                }
            }
        }
        const updatedCard = await this.cardRepository.save(card);
        if (deadline !== undefined) {
            this.activitiesService
                .createLog({
                userId,
                boardId: card.list.boardId,
                cardId: updatedCard.id,
                action: enums_1.ActivityAction.UPDATE_CARD,
                entityTitle: updatedCard.title,
                details: {
                    field: 'deadline',
                    deadline: deadline || null,
                },
                content: deadline
                    ? `Đặt hạn chót "${updatedCard.title}" → ${new Date(deadline).toLocaleDateString('vi-VN')}`
                    : `Xóa hạn chót "${updatedCard.title}"`,
            })
                .catch((err) => console.error('Failed to log deadline change:', err));
        }
        if (rest.assigneeId !== undefined &&
            rest.assigneeId !== null &&
            rest.assigneeId !== previousAssigneeId) {
            this.activitiesService
                .createLog({
                userId,
                boardId: card.list.boardId,
                cardId: updatedCard.id,
                action: enums_1.ActivityAction.ADD_MEMBER,
                entityTitle: updatedCard.title,
                details: {
                    memberUserId: rest.assigneeId,
                },
                content: `Đã thêm thành viên vào thẻ "${updatedCard.title}"`,
            })
                .catch((err) => console.error('Failed to log member add:', err));
        }
        if (rest.assigneeId !== undefined &&
            rest.assigneeId !== null &&
            rest.assigneeId !== previousAssigneeId) {
            const boardId = card.list?.boardId;
            this.notificationsService.create({
                userId: rest.assigneeId,
                cardId: updatedCard.id,
                type: entities_1.NotificationType.CARD_ASSIGNED,
                title: 'Bạn được giao một thẻ mới',
                message: `Bạn được giao thẻ "${updatedCard.title}"`,
                link: boardId
                    ? `/b/${boardId}?cardId=${updatedCard.id}&focus=activity`
                    : undefined,
                metadata: {
                    boardId,
                    cardId: updatedCard.id,
                    listId: updatedCard.listId,
                },
            }).catch(() => null);
        }
        const fullUpdatedCard = await this.findOne(updatedCard.id);
        const boardIdForEmit = fullUpdatedCard.list.boardId;
        this.cardsGateway.emitCardUpdated(boardIdForEmit, fullUpdatedCard);
        return fullUpdatedCard;
    }
    async addMember(cardId, userId, addedByUserId) {
        const card = await this.findOne(cardId);
        await this.validateMemberInBoard(card.listId, userId);
        const hasMember = (card.members || []).some((member) => member.id === userId);
        if (!hasMember) {
            await this.cardRepository
                .createQueryBuilder()
                .relation(entities_1.Card, 'members')
                .of(cardId)
                .add(userId);
            if (addedByUserId) {
                this.activitiesService
                    .createLog({
                    userId: addedByUserId,
                    boardId: card.list?.boardId || '',
                    cardId,
                    action: enums_1.ActivityAction.ADD_MEMBER,
                    entityTitle: card.title,
                    details: {
                        memberUserId: userId,
                    },
                    content: `Đã thêm thành viên vào thẻ "${card.title}"`,
                })
                    .catch((err) => console.error('Failed to log member add:', err));
            }
        }
        if (!card.assigneeId) {
            await this.cardRepository.update(cardId, { assigneeId: userId });
        }
        this.notificationsService.create({
            userId,
            cardId,
            type: entities_1.NotificationType.CARD_ASSIGNED,
            title: 'Bạn được thêm vào thẻ',
            message: `Bạn vừa được thêm vào thẻ "${card.title}"`,
            link: card.list?.boardId
                ? `/b/${card.list.boardId}?cardId=${cardId}&focus=activity`
                : undefined,
            metadata: {
                boardId: card.list?.boardId,
                cardId,
            },
        }).catch(() => null);
        const fullCard = await this.findOne(cardId);
        this.cardsGateway.emitCardUpdated(fullCard.list.boardId, fullCard);
        return fullCard;
    }
    async removeMember(cardId, userId) {
        const card = await this.findOne(cardId);
        const hasMember = (card.members || []).some((member) => member.id === userId);
        if (hasMember) {
            await this.cardRepository
                .createQueryBuilder()
                .relation(entities_1.Card, 'members')
                .of(cardId)
                .remove(userId);
        }
        if (card.assigneeId === userId) {
            await this.cardRepository.update(cardId, { assigneeId: null });
        }
        const fullCard = await this.findOne(cardId);
        this.cardsGateway.emitCardUpdated(fullCard.list.boardId, fullCard);
        return fullCard;
    }
    async remove(id) {
        const card = await this.findOne(id);
        const boardId = card.list.boardId;
        await this.dataSource.transaction(async (manager) => {
            await manager.softDelete(entities_1.Attachment, { cardId: id });
            await manager.softDelete(entities_1.Card, { id });
        });
        this.cardsGateway.emitCardDeleted(boardId, id);
    }
    async restore(id) {
        const card = await this.cardRepository.findOne({
            where: { id },
            withDeleted: true,
            relations: ['list'],
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!card.deletedAt) {
            return this.findOne(id);
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.restore(entities_1.Card, { id });
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Attachment)
                .where('card_id = :cardId', { cardId: id })
                .execute();
        });
        const restoredCard = await this.findOne(id);
        this.cardsGateway.emitCardUpdated(restoredCard.list.boardId, restoredCard);
        return restoredCard;
    }
    async moveCard(id, moveCardDto, userId) {
        const { targetListId, prevCardId, nextCardId } = moveCardDto;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let savedCard;
        let oldListTitle;
        let targetListTitle;
        let boardId;
        let fromListId;
        let isListChanged;
        let cardTitle;
        try {
            const card = await queryRunner.manager.findOne(entities_1.Card, {
                where: { id },
                relations: ['list'],
            });
            if (!card) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
            }
            oldListTitle = card.list.title;
            fromListId = card.listId;
            cardTitle = card.title;
            const targetList = await queryRunner.manager.findOne(entities_1.List, {
                where: { id: targetListId },
            });
            if (!targetList) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
            }
            targetListTitle = targetList.title;
            boardId = targetList.boardId;
            isListChanged = fromListId !== targetListId;
            let newPosition;
            if (!prevCardId && !nextCardId) {
                const lastCard = await queryRunner.manager.findOne(entities_1.Card, {
                    where: { listId: targetListId, id: (0, typeorm_2.Not)(id) },
                    order: { position: 'DESC' },
                });
                newPosition = lastCard
                    ? lastCard.position + POSITION_GAP
                    : POSITION_GAP;
            }
            else if (!prevCardId && nextCardId) {
                const nextCard = await queryRunner.manager.findOne(entities_1.Card, {
                    where: { id: nextCardId },
                });
                if (!nextCard) {
                    throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
                }
                newPosition = nextCard.position / 2;
            }
            else if (prevCardId && !nextCardId) {
                const prevCard = await queryRunner.manager.findOne(entities_1.Card, {
                    where: { id: prevCardId },
                });
                if (!prevCard) {
                    throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
                }
                newPosition = prevCard.position + POSITION_GAP;
            }
            else {
                const [prevCard, nextCard] = await Promise.all([
                    queryRunner.manager.findOne(entities_1.Card, { where: { id: prevCardId } }),
                    queryRunner.manager.findOne(entities_1.Card, { where: { id: nextCardId } }),
                ]);
                if (!prevCard || !nextCard) {
                    throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
                }
                newPosition = (prevCard.position + nextCard.position) / 2;
            }
            await queryRunner.manager.update(entities_1.Card, { id }, {
                listId: targetListId,
                position: newPosition,
            });
            const updatedCard = await queryRunner.manager.findOne(entities_1.Card, {
                where: { id },
            });
            if (!updatedCard) {
                throw new common_1.NotFoundException(`Card with ID ${id} not found after update`);
            }
            savedCard = updatedCard;
            await queryRunner.commitTransaction();
        }
        catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        if (isListChanged) {
            const logContent = `Đã chuyển thẻ "${savedCard.title}" từ "${oldListTitle}" sang "${targetListTitle}"`;
            this.activitiesService
                .createLog({
                userId,
                boardId,
                cardId: savedCard.id,
                action: enums_1.ActivityAction.MOVE_CARD,
                entityTitle: savedCard.title,
                details: {
                    fromList: oldListTitle,
                    toList: targetListTitle,
                },
                content: logContent,
            })
                .catch((err) => console.error('Failed to log card move:', err));
        }
        this.cardsGateway.emitCardMoved(boardId, {
            card: savedCard,
            fromListId,
            toListId: targetListId,
        });
        return savedCard;
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.List)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.BoardMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        activities_service_1.ActivitiesService,
        cards_gateway_1.CardsGateway,
        notifications_service_1.NotificationsService])
], CardsService);
//# sourceMappingURL=cards.service.js.map