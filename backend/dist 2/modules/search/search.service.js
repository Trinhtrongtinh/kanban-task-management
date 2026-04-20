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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const dto_1 = require("./dto");
const enums_1 = require("../../common/enums");
let SearchService = class SearchService {
    workspaceRepository;
    boardRepository;
    cardRepository;
    listRepository;
    commentRepository;
    constructor(workspaceRepository, boardRepository, cardRepository, listRepository, commentRepository) {
        this.workspaceRepository = workspaceRepository;
        this.boardRepository = boardRepository;
        this.cardRepository = cardRepository;
        this.listRepository = listRepository;
        this.commentRepository = commentRepository;
    }
    async globalSearch(dto, userId) {
        const keyword = `%${dto.q}%`;
        const accessParams = {
            userId,
            activeStatus: enums_1.MemberStatus.ACTIVE,
            keyword,
        };
        const [workspaces, boards, lists, cards, comments] = await Promise.all([
            this.workspaceRepository
                .createQueryBuilder('workspace')
                .leftJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus', accessParams)
                .where('(workspace.ownerId = :userId OR wm.id IS NOT NULL)', { userId })
                .andWhere('workspace.name LIKE :keyword', { keyword })
                .select('workspace.id', 'id')
                .addSelect('workspace.name', 'name')
                .addSelect('workspace.slug', 'slug')
                .addSelect('workspace.type', 'type')
                .addSelect('workspace.updatedAt', 'updatedAt')
                .orderBy('workspace.updatedAt', 'DESC')
                .limit(8)
                .getRawMany(),
            this.boardRepository
                .createQueryBuilder('board')
                .innerJoin('board.workspace', 'workspace')
                .leftJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus', accessParams)
                .leftJoin('board_members', 'bm', 'bm.board_id = board.id AND bm.user_id = :userId', { userId })
                .where('(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)', { userId })
                .andWhere('board.title LIKE :keyword', { keyword })
                .select('board.id', 'id')
                .addSelect('board.title', 'title')
                .addSelect('board.slug', 'slug')
                .addSelect('board.visibility', 'visibility')
                .addSelect('board.workspaceId', 'workspaceId')
                .addSelect('workspace.name', 'workspaceName')
                .addSelect('board.updatedAt', 'updatedAt')
                .orderBy('board.updatedAt', 'DESC')
                .limit(10)
                .getRawMany(),
            this.listRepository
                .createQueryBuilder('list')
                .innerJoin('list.board', 'board')
                .innerJoin('board.workspace', 'workspace')
                .leftJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus', accessParams)
                .leftJoin('board_members', 'bm', 'bm.board_id = board.id AND bm.user_id = :userId', { userId })
                .where('(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)', { userId })
                .andWhere('list.title LIKE :keyword', { keyword })
                .select('list.id', 'id')
                .addSelect('list.title', 'title')
                .addSelect('list.boardId', 'boardId')
                .addSelect('board.title', 'boardTitle')
                .addSelect('board.workspaceId', 'workspaceId')
                .addSelect('workspace.name', 'workspaceName')
                .addSelect('list.updatedAt', 'updatedAt')
                .orderBy('list.updatedAt', 'DESC')
                .limit(10)
                .getRawMany(),
            this.cardRepository
                .createQueryBuilder('card')
                .innerJoin('card.list', 'list')
                .innerJoin('list.board', 'board')
                .innerJoin('board.workspace', 'workspace')
                .leftJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus', accessParams)
                .leftJoin('board_members', 'bm', 'bm.board_id = board.id AND bm.user_id = :userId', { userId })
                .where('(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)', { userId })
                .andWhere('card.isArchived = :isArchived', { isArchived: false })
                .andWhere(new typeorm_2.Brackets((qb) => {
                qb.where('card.title LIKE :keyword', { keyword })
                    .orWhere('card.description LIKE :keyword', { keyword })
                    .orWhere(`EXISTS (
                  SELECT 1
                  FROM card_labels cl
                  INNER JOIN labels l ON l.id = cl.label_id
                  WHERE cl.card_id = card.id
                    AND l.name LIKE :keyword
                )`, { keyword });
            }))
                .select('card.id', 'id')
                .addSelect('card.title', 'title')
                .addSelect('card.description', 'description')
                .addSelect('card.listId', 'listId')
                .addSelect('list.title', 'listTitle')
                .addSelect('list.boardId', 'boardId')
                .addSelect('board.title', 'boardTitle')
                .addSelect('board.workspaceId', 'workspaceId')
                .addSelect('workspace.name', 'workspaceName')
                .addSelect('card.deadline', 'deadline')
                .addSelect('card.isArchived', 'isArchived')
                .addSelect('card.updatedAt', 'updatedAt')
                .orderBy('card.updatedAt', 'DESC')
                .limit(12)
                .getRawMany(),
            this.commentRepository
                .createQueryBuilder('comment')
                .innerJoin('comment.card', 'card')
                .innerJoin('card.list', 'list')
                .innerJoin('list.board', 'board')
                .innerJoin('board.workspace', 'workspace')
                .leftJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus', accessParams)
                .leftJoin('board_members', 'bm', 'bm.board_id = board.id AND bm.user_id = :userId', { userId })
                .where('(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)', { userId })
                .andWhere('card.isArchived = :isArchived', { isArchived: false })
                .andWhere('comment.content LIKE :keyword', { keyword })
                .select('comment.id', 'id')
                .addSelect('comment.content', 'content')
                .addSelect('comment.cardId', 'cardId')
                .addSelect('card.title', 'cardTitle')
                .addSelect('card.listId', 'listId')
                .addSelect('list.title', 'listTitle')
                .addSelect('list.boardId', 'boardId')
                .addSelect('board.title', 'boardTitle')
                .addSelect('board.workspaceId', 'workspaceId')
                .addSelect('workspace.name', 'workspaceName')
                .addSelect('comment.updatedAt', 'updatedAt')
                .orderBy('comment.updatedAt', 'DESC')
                .limit(12)
                .getRawMany(),
        ]);
        const cardIds = cards.map((card) => card.id).filter(Boolean);
        const cardLabelsRaw = cardIds.length
            ? await this.cardRepository
                .createQueryBuilder('card')
                .leftJoin('card.labels', 'label')
                .where('card.id IN (:...cardIds)', { cardIds })
                .select('card.id', 'cardId')
                .addSelect('label.name', 'labelName')
                .getRawMany()
            : [];
        const labelMap = new Map();
        for (const row of cardLabelsRaw) {
            if (!row.labelName)
                continue;
            const current = labelMap.get(row.cardId) ?? [];
            if (!current.includes(row.labelName)) {
                current.push(row.labelName);
            }
            labelMap.set(row.cardId, current);
        }
        const cardsWithLabels = cards.map((card) => ({
            ...card,
            labels: labelMap.get(card.id) ?? [],
        }));
        return {
            workspaces,
            boards,
            lists,
            cards: cardsWithLabels,
            comments,
            total: {
                workspaces: workspaces.length,
                boards: boards.length,
                lists: lists.length,
                cards: cardsWithLabels.length,
                comments: comments.length,
            },
        };
    }
    async advancedSearch(dto, userId) {
        const queryBuilder = this.cardRepository
            .createQueryBuilder('card')
            .innerJoin('card.list', 'list')
            .innerJoin('list.board', 'board')
            .innerJoin('board.workspace', 'workspace')
            .leftJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus', { userId, activeStatus: enums_1.MemberStatus.ACTIVE })
            .leftJoin('board_members', 'bm', 'bm.board_id = board.id AND bm.user_id = :userId', { userId })
            .where('workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL', { userId })
            .andWhere('card.isArchived = :isArchived', { isArchived: false });
        if (dto.boardId) {
            queryBuilder.andWhere('list.boardId = :boardId', {
                boardId: dto.boardId,
            });
        }
        if (dto.labelIds && dto.labelIds.length > 0) {
            queryBuilder
                .innerJoin('card.labels', 'label')
                .andWhere('label.id IN (:...labelIds)', { labelIds: dto.labelIds });
        }
        if (dto.dueDate) {
            const now = new Date();
            const sevenDaysLater = new Date();
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
            switch (dto.dueDate) {
                case dto_1.DueDateFilter.OVERDUE:
                    queryBuilder.andWhere('card.deadline < :now', { now });
                    break;
                case dto_1.DueDateFilter.DUE_SOON:
                    queryBuilder.andWhere('card.deadline >= :now', { now });
                    queryBuilder.andWhere('card.deadline <= :sevenDaysLater', {
                        sevenDaysLater,
                    });
                    break;
                case dto_1.DueDateFilter.NO_DEADLINE:
                    queryBuilder.andWhere('card.deadline IS NULL');
                    break;
            }
        }
        const cards = await queryBuilder
            .select([
            'card.id',
            'card.title',
            'card.description',
            'card.listId',
            'card.position',
            'card.deadline',
            'card.isArchived',
            'card.createdAt',
        ])
            .leftJoinAndSelect('card.labels', 'cardLabels')
            .addSelect(['list.id', 'list.title', 'list.boardId'])
            .orderBy('card.position', 'ASC')
            .getMany();
        return {
            cards,
            total: cards.length,
            filters: {
                boardId: dto.boardId || null,
                labelIds: dto.labelIds || [],
                dueDate: dto.dueDate || null,
            },
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Board)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.List)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SearchService);
//# sourceMappingURL=search.service.js.map