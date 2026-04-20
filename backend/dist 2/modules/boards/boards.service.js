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
exports.BoardsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const entities_2 = require("../../database/entities");
const cache_1 = require("../../common/cache");
const utils_1 = require("../../common/utils");
const activities_service_1 = require("../activities/activities.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../../database/entities/notification.entity");
const FREE_PLAN_BOARD_LIMIT = 3;
let BoardsService = class BoardsService {
    boardRepository;
    workspaceRepository;
    boardMemberRepository;
    userRepository;
    dataSource;
    cacheService;
    activitiesService;
    notificationsService;
    constructor(boardRepository, workspaceRepository, boardMemberRepository, userRepository, dataSource, cacheService, activitiesService, notificationsService) {
        this.boardRepository = boardRepository;
        this.workspaceRepository = workspaceRepository;
        this.boardMemberRepository = boardMemberRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.cacheService = cacheService;
        this.activitiesService = activitiesService;
        this.notificationsService = notificationsService;
    }
    async getWorkspaceAudienceUserIds(workspaceId) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id: workspaceId },
            select: ['ownerId'],
        });
        if (!workspace) {
            return [];
        }
        const members = await this.boardRepository.manager.find(entities_1.WorkspaceMember, {
            where: { workspaceId, status: enums_1.MemberStatus.ACTIVE },
            select: ['userId'],
        });
        return Array.from(new Set([workspace.ownerId, ...members.map((member) => member.userId)]));
    }
    async invalidateBoardsByWorkspace(workspaceId) {
        const userIds = await this.getWorkspaceAudienceUserIds(workspaceId);
        const keys = userIds.flatMap((userId) => {
            const baseKey = cache_1.CacheKeys.boardsByWorkspaceAndUser(workspaceId, userId);
            return [`${baseKey}:joined:0`, `${baseKey}:joined:1`];
        });
        await this.cacheService.delMany(keys);
    }
    generateSlug(title) {
        const vietnameseMap = {
            à: 'a',
            á: 'a',
            ả: 'a',
            ã: 'a',
            ạ: 'a',
            ă: 'a',
            ằ: 'a',
            ắ: 'a',
            ẳ: 'a',
            ẵ: 'a',
            ặ: 'a',
            â: 'a',
            ầ: 'a',
            ấ: 'a',
            ẩ: 'a',
            ẫ: 'a',
            ậ: 'a',
            đ: 'd',
            è: 'e',
            é: 'e',
            ẻ: 'e',
            ẽ: 'e',
            ẹ: 'e',
            ê: 'e',
            ề: 'e',
            ế: 'e',
            ể: 'e',
            ễ: 'e',
            ệ: 'e',
            ì: 'i',
            í: 'i',
            ỉ: 'i',
            ĩ: 'i',
            ị: 'i',
            ò: 'o',
            ó: 'o',
            ỏ: 'o',
            õ: 'o',
            ọ: 'o',
            ô: 'o',
            ồ: 'o',
            ố: 'o',
            ổ: 'o',
            ỗ: 'o',
            ộ: 'o',
            ơ: 'o',
            ờ: 'o',
            ớ: 'o',
            ở: 'o',
            ỡ: 'o',
            ợ: 'o',
            ù: 'u',
            ú: 'u',
            ủ: 'u',
            ũ: 'u',
            ụ: 'u',
            ư: 'u',
            ừ: 'u',
            ứ: 'u',
            ử: 'u',
            ữ: 'u',
            ự: 'u',
            ỳ: 'y',
            ý: 'y',
            ỷ: 'y',
            ỹ: 'y',
            ỵ: 'y',
        };
        return title
            .toLowerCase()
            .split('')
            .map((char) => vietnameseMap[char] || char)
            .join('')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    async ensureUniqueSlug(slug, excludeId) {
        let uniqueSlug = slug;
        let counter = 1;
        while (true) {
            const existingBoard = await this.boardRepository.findOne({
                where: { slug: uniqueSlug },
            });
            if (!existingBoard || existingBoard.id === excludeId) {
                break;
            }
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        return uniqueSlug;
    }
    async validateWorkspaceExists(workspaceId) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async create(createBoardDto, userId) {
        const { title, slug, workspaceId, ...rest } = createBoardDto;
        const normalizedTitle = title.trim();
        const workspace = await this.workspaceRepository.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (workspace.ownerId !== userId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_ACCESS_DENIED, common_1.HttpStatus.FORBIDDEN, 'Chỉ người tạo workspace mới có thể tạo bảng');
        }
        const existingBoardWithSameTitle = await this.boardRepository
            .createQueryBuilder('board')
            .where('board.workspace_id = :workspaceId', { workspaceId })
            .andWhere('board.deleted_at IS NULL')
            .andWhere('LOWER(TRIM(board.title)) = LOWER(TRIM(:title))', {
            title: normalizedTitle,
        })
            .getOne();
        if (existingBoardWithSameTitle) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_TITLE_EXISTS, common_1.HttpStatus.CONFLICT, 'Tên bảng đã tồn tại trong workspace này');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user && !(0, utils_1.isProPlanActive)(user)) {
            const boardCount = await this.boardRepository.count({ where: { workspaceId } });
            if (boardCount >= FREE_PLAN_BOARD_LIMIT) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.PLAN_LIMIT_EXCEEDED, common_1.HttpStatus.FORBIDDEN, `Gói Free chỉ cho phép tối đa ${FREE_PLAN_BOARD_LIMIT} bảng. Nâng cấp lên Pro để tạo không giới hạn.`);
            }
        }
        let boardSlug = slug || this.generateSlug(title);
        boardSlug = await this.ensureUniqueSlug(boardSlug);
        const board = this.boardRepository.create({
            title: normalizedTitle,
            slug: boardSlug,
            workspaceId,
            ...rest,
        });
        const savedBoard = await this.boardRepository.save(board);
        const boardMember = this.boardMemberRepository.create({
            boardId: savedBoard.id,
            userId,
            role: enums_1.BoardRole.ADMIN,
        });
        await this.boardMemberRepository.save(boardMember);
        await this.invalidateBoardsByWorkspace(workspaceId);
        this.activitiesService
            .createLog({
            userId,
            boardId: savedBoard.id,
            action: enums_1.ActivityAction.CREATE_BOARD,
            entityTitle: savedBoard.title,
            details: {
                workspaceId,
            },
            content: `Đã tạo board "${savedBoard.title}"`,
        })
            .catch(() => null);
        return savedBoard;
    }
    async findAllByWorkspace(workspaceId, userId, joinedOnly = false) {
        const cacheKey = `${cache_1.CacheKeys.boardsByWorkspaceAndUser(workspaceId, userId)}:joined:${joinedOnly ? 1 : 0}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const workspace = await this.workspaceRepository.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        const query = this.boardRepository
            .createQueryBuilder('board')
            .leftJoinAndSelect('board.workspace', 'workspace')
            .where('board.workspace_id = :workspaceId', { workspaceId })
            .andWhere('board.deleted_at IS NULL');
        if (joinedOnly || workspace.ownerId !== userId) {
            query
                .innerJoin('board_members', 'bm', 'bm.board_id = board.id')
                .andWhere('bm.user_id = :userId', { userId });
        }
        const boards = await query.orderBy('board.created_at', 'DESC').getMany();
        await this.cacheService.set(cacheKey, boards, cache_1.CACHE_TTL.BOARDS_BY_WORKSPACE_SECONDS);
        return boards;
    }
    async findDeletedByWorkspace(workspaceId) {
        return this.boardRepository.find({
            where: { workspaceId },
            withDeleted: true,
            order: { updatedAt: 'DESC' },
        }).then((boards) => boards.filter((board) => !!board.deletedAt));
    }
    async findOne(id) {
        const board = await this.boardRepository.findOne({
            where: { id },
            relations: ['workspace'],
        });
        if (!board) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return board;
    }
    async update(id, updateBoardDto, userId) {
        const board = await this.findOne(id);
        const previousTitle = board.title;
        const { slug, title, ...rest } = updateBoardDto;
        if (slug) {
            const uniqueSlug = await this.ensureUniqueSlug(slug, id);
            if (uniqueSlug !== slug) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_SLUG_EXISTS, common_1.HttpStatus.CONFLICT);
            }
            board.slug = slug;
        }
        else if (title && title !== board.title) {
            const newSlug = this.generateSlug(title);
            board.slug = await this.ensureUniqueSlug(newSlug, id);
        }
        if (title) {
            const normalizedTitle = title.trim();
            const existingBoardWithSameTitle = await this.boardRepository
                .createQueryBuilder('b')
                .where('b.workspace_id = :workspaceId', { workspaceId: board.workspaceId })
                .andWhere('b.id != :id', { id: board.id })
                .andWhere('b.deleted_at IS NULL')
                .andWhere('LOWER(TRIM(b.title)) = LOWER(TRIM(:title))', {
                title: normalizedTitle,
            })
                .getOne();
            if (existingBoardWithSameTitle) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_TITLE_EXISTS, common_1.HttpStatus.CONFLICT, 'Tên bảng đã tồn tại trong workspace này');
            }
            board.title = normalizedTitle;
        }
        Object.assign(board, rest);
        const updatedBoard = await this.boardRepository.save(board);
        await this.invalidateBoardsByWorkspace(board.workspaceId);
        this.activitiesService
            .createLog({
            userId,
            boardId: updatedBoard.id,
            action: enums_1.ActivityAction.UPDATE_BOARD,
            entityTitle: updatedBoard.title,
            details: {
                oldTitle: previousTitle,
                newTitle: updatedBoard.title,
            },
            content: previousTitle !== updatedBoard.title
                ? `Đã đổi tên board từ "${previousTitle}" thành "${updatedBoard.title}"`
                : `Đã cập nhật board "${updatedBoard.title}"`,
        })
            .catch(() => null);
        return updatedBoard;
    }
    async remove(id) {
        const board = await this.findOne(id);
        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(entities_1.Attachment)
                .where('card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id WHERE l.board_id = :boardId AND c.deleted_at IS NULL AND l.deleted_at IS NULL)', { boardId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(entities_1.Card)
                .where('list_id IN (SELECT id FROM lists WHERE board_id = :boardId AND deleted_at IS NULL)', {
                boardId: id,
            })
                .execute();
            await manager.softDelete(entities_1.List, { boardId: id });
            await manager.softDelete(entities_1.Board, { id });
        });
        await this.invalidateBoardsByWorkspace(board.workspaceId);
    }
    async restore(id) {
        const board = await this.boardRepository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!board) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!board.deletedAt) {
            return this.findOne(id);
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.restore(entities_1.Board, { id });
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.List)
                .where('board_id = :boardId', { boardId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Card)
                .where('list_id IN (SELECT id FROM lists WHERE board_id = :boardId)', { boardId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Attachment)
                .where('card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id WHERE l.board_id = :boardId)', { boardId: id })
                .execute();
        });
        await this.invalidateBoardsByWorkspace(board.workspaceId);
        return this.findOne(id);
    }
    async getMembers(boardId) {
        const boardMembers = await this.boardMemberRepository.find({
            where: { boardId },
            relations: ['user'],
        });
        return boardMembers.map(bm => ({ ...bm.user, role: bm.role }));
    }
    async addMember(boardId, userId, actorId) {
        const board = await this.findOne(boardId);
        const workspaceMember = await this.boardRepository.manager.findOne(entities_1.WorkspaceMember, {
            where: { workspaceId: board.workspaceId, userId, status: enums_1.MemberStatus.ACTIVE },
        });
        if (!workspaceMember) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.FORBIDDEN, 'Thành viên phải thuộc Workspace mới có thể thêm vào bảng');
        }
        const existing = await this.boardMemberRepository.findOne({
            where: { boardId, userId }
        });
        if (existing) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_ALREADY_EXISTS, common_1.HttpStatus.BAD_REQUEST, 'Người dùng đã ở trong bảng này');
        }
        const newMember = this.boardMemberRepository.create({
            boardId,
            userId,
            role: enums_1.BoardRole.EDITOR
        });
        const savedMember = await this.boardMemberRepository.save(newMember);
        await this.invalidateBoardsByWorkspace(board.workspaceId);
        const actor = await this.userRepository.findOne({
            where: { id: actorId },
            select: ['username', 'email'],
        });
        const actorName = actor?.username || actor?.email || 'Ai đó';
        this.notificationsService
            .create({
            userId,
            type: notification_entity_1.NotificationType.BOARD_MEMBER_ADDED,
            title: 'Bạn được thêm vào bảng',
            message: `${actorName} đã thêm bạn vào bảng "${board.title}"`,
            link: `/b/${boardId}`,
            metadata: { boardId, boardTitle: board.title, actorId },
        })
            .catch(() => null);
        this.activitiesService
            .createLog({
            userId: actorId,
            boardId,
            action: enums_1.ActivityAction.ADD_MEMBER,
            entityTitle: board.title,
            details: {
                memberUserId: userId,
            },
            content: `Đã thêm thành viên vào board "${board.title}"`,
        })
            .catch(() => null);
        return savedMember;
    }
    async removeMember(boardId, userId, actorId) {
        const board = await this.findOne(boardId);
        const existing = await this.boardMemberRepository.findOne({
            where: { boardId, userId }
        });
        if (existing) {
            await this.boardMemberRepository.remove(existing);
            this.activitiesService
                .createLog({
                userId: actorId,
                boardId,
                action: enums_1.ActivityAction.REMOVE_MEMBER,
                entityTitle: board.title,
                details: {
                    memberUserId: userId,
                },
                content: `Đã xóa thành viên khỏi board "${board.title}"`,
            })
                .catch(() => null);
        }
        await this.invalidateBoardsByWorkspace(board.workspaceId);
    }
};
exports.BoardsService = BoardsService;
exports.BoardsService = BoardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Board)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.BoardMember)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_2.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        cache_1.AppCacheService,
        activities_service_1.ActivitiesService,
        notifications_service_1.NotificationsService])
], BoardsService);
//# sourceMappingURL=boards.service.js.map