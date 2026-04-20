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
var WorkspacesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const entities_1 = require("../../database/entities");
const notification_entity_1 = require("../../database/entities/notification.entity");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const users_service_1 = require("../users/users.service");
const mailer_service_1 = require("../notifications/mailer.service");
const notifications_service_1 = require("../notifications/notifications.service");
const cache_1 = require("../../common/cache");
const config_1 = require("../../config");
let WorkspacesService = WorkspacesService_1 = class WorkspacesService {
    workspaceRepository;
    workspaceMemberRepository;
    userRepository;
    dataSource;
    usersService;
    mailerService;
    app;
    notificationsService;
    cacheService;
    logger = new common_1.Logger(WorkspacesService_1.name);
    constructor(workspaceRepository, workspaceMemberRepository, userRepository, dataSource, usersService, mailerService, app, notificationsService, cacheService) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.usersService = usersService;
        this.mailerService = mailerService;
        this.app = app;
        this.notificationsService = notificationsService;
        this.cacheService = cacheService;
    }
    async invalidateWorkspaceLists(userIds) {
        const keys = Array.from(new Set(userIds)).map((userId) => cache_1.CacheKeys.workspacesByUser(userId));
        await this.cacheService.delMany(keys);
    }
    async getActiveMemberUserIds(workspaceId) {
        const members = await this.workspaceMemberRepository.find({
            where: { workspaceId, status: enums_1.MemberStatus.ACTIVE },
            select: ['userId'],
        });
        return Array.from(new Set(members.map((member) => member.userId)));
    }
    async onModuleInit() {
        try {
            const result = await this.workspaceMemberRepository
                .createQueryBuilder()
                .update(entities_1.WorkspaceMember)
                .set({ role: enums_1.WorkspaceRole.MEMBER })
                .where('role != :ownerRole', { ownerRole: enums_1.WorkspaceRole.OWNER })
                .execute();
            if ((result.affected ?? 0) > 0) {
                this.logger.log(`Normalized ${(result.affected ?? 0)} workspace member role(s) to MEMBER`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to normalize workspace member roles: ${error?.message || error}`);
        }
    }
    generateSlug(name) {
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
        return name
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
            const existingWorkspace = await this.workspaceRepository.findOne({
                where: { slug: uniqueSlug },
                withDeleted: true,
            });
            if (!existingWorkspace || existingWorkspace.id === excludeId) {
                break;
            }
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        return uniqueSlug;
    }
    async create(createWorkspaceDto, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        const existingOwnedWorkspace = await this.workspaceRepository.findOne({
            where: { ownerId: userId },
            withDeleted: true,
        });
        if (existingOwnedWorkspace) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.PLAN_LIMIT_EXCEEDED, common_1.HttpStatus.FORBIDDEN, existingOwnedWorkspace.deletedAt
                ? 'Bạn đã có workspace đã xóa. Hãy khôi phục workspace đó thay vì tạo mới.'
                : 'Mỗi tài khoản chỉ có thể tạo tối đa 1 workspace.');
        }
        const { name, slug, ...rest } = createWorkspaceDto;
        let workspaceSlug = slug || this.generateSlug(name);
        workspaceSlug = await this.ensureUniqueSlug(workspaceSlug);
        const workspace = this.workspaceRepository.create({
            name,
            slug: workspaceSlug,
            ownerId: userId,
            ...rest,
        });
        const savedWorkspace = await this.workspaceRepository.save(workspace);
        const workspaceMember = this.workspaceMemberRepository.create({
            workspaceId: savedWorkspace.id,
            userId,
            role: enums_1.WorkspaceRole.OWNER,
            status: enums_1.MemberStatus.ACTIVE,
        });
        await this.workspaceMemberRepository.save(workspaceMember);
        await this.invalidateWorkspaceLists([userId]);
        return savedWorkspace;
    }
    async findAllByUser(userId) {
        const cacheKey = cache_1.CacheKeys.workspacesByUser(userId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const memberships = await this.workspaceMemberRepository.find({
            where: { userId, status: enums_1.MemberStatus.ACTIVE },
            relations: ['workspace', 'workspace.owner'],
        });
        const workspaceIds = memberships.map((m) => m.workspaceId);
        if (workspaceIds.length === 0) {
            await this.cacheService.set(cacheKey, [], cache_1.CACHE_TTL.WORKSPACES_BY_USER_SECONDS);
            return [];
        }
        const workspaces = await this.workspaceRepository.find({
            where: { id: (0, typeorm_2.In)(workspaceIds) },
            relations: ['owner', 'boards'],
            order: { createdAt: 'ASC' },
        });
        const workspaceOrder = new Map(workspaceIds.map((id, index) => [id, index]));
        const sortedWorkspaces = workspaces.sort((a, b) => (workspaceOrder.get(a.id) ?? 0) - (workspaceOrder.get(b.id) ?? 0));
        await this.cacheService.set(cacheKey, sortedWorkspaces, cache_1.CACHE_TTL.WORKSPACES_BY_USER_SECONDS);
        return sortedWorkspaces;
    }
    async findAll() {
        return this.workspaceRepository.find({
            relations: ['owner'],
        });
    }
    async findOne(id) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id },
            relations: ['owner'],
        });
        if (!workspace) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return workspace;
    }
    async update(id, updateWorkspaceDto) {
        const workspace = await this.findOne(id);
        const { slug, name, ...rest } = updateWorkspaceDto;
        if (slug) {
            const uniqueSlug = await this.ensureUniqueSlug(slug, id);
            if (uniqueSlug !== slug) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_SLUG_EXISTS, common_1.HttpStatus.CONFLICT);
            }
            workspace.slug = slug;
        }
        else if (name && name !== workspace.name) {
            const newSlug = this.generateSlug(name);
            workspace.slug = await this.ensureUniqueSlug(newSlug, id);
        }
        if (name) {
            workspace.name = name;
        }
        Object.assign(workspace, rest);
        const updatedWorkspace = await this.workspaceRepository.save(workspace);
        const memberIds = await this.getActiveMemberUserIds(id);
        await this.invalidateWorkspaceLists(memberIds);
        return updatedWorkspace;
    }
    async remove(id, requesterId) {
        const workspace = await this.findOne(id);
        if (workspace.ownerId !== requesterId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.FORBIDDEN, 'Chỉ chủ sở hữu workspace mới có thể xóa workspace');
        }
        const memberIds = await this.getActiveMemberUserIds(id);
        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(entities_1.Attachment)
                .where('card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId AND c.deleted_at IS NULL AND l.deleted_at IS NULL AND b.deleted_at IS NULL)', { workspaceId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(entities_1.Card)
                .where('list_id IN (SELECT l.id FROM lists l INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId AND l.deleted_at IS NULL AND b.deleted_at IS NULL)', { workspaceId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(entities_1.List)
                .where('board_id IN (SELECT id FROM boards WHERE workspace_id = :workspaceId AND deleted_at IS NULL)', {
                workspaceId: id,
            })
                .execute();
            await manager.softDelete(entities_1.Board, { workspaceId: id });
            await manager.softDelete(entities_1.Workspace, { id });
        });
        await this.invalidateWorkspaceLists(memberIds);
    }
    async restore(id, requesterId) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id },
            withDeleted: true,
            relations: ['owner'],
        });
        if (!workspace) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.WORKSPACE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (workspace.ownerId !== requesterId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.FORBIDDEN, 'Chỉ chủ sở hữu workspace mới có thể khôi phục workspace');
        }
        if (!workspace.deletedAt) {
            return this.findOne(id);
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.restore(entities_1.Workspace, { id });
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Board)
                .where('workspace_id = :workspaceId', { workspaceId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.List)
                .where('board_id IN (SELECT id FROM boards WHERE workspace_id = :workspaceId)', { workspaceId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Card)
                .where('list_id IN (SELECT l.id FROM lists l INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId)', { workspaceId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Attachment)
                .where('card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId)', { workspaceId: id })
                .execute();
        });
        const memberIds = await this.getActiveMemberUserIds(id);
        await this.invalidateWorkspaceLists(memberIds);
        return this.findOne(id);
    }
    async findDeletedOwnedByUser(userId) {
        return this.workspaceRepository.find({
            where: { ownerId: userId },
            withDeleted: true,
            order: { updatedAt: 'DESC' },
        }).then((items) => items.filter((workspace) => !!workspace.deletedAt));
    }
    async inviteMember(workspaceId, inviteMemberDto, inviterId) {
        const { email } = inviteMemberDto;
        const role = enums_1.WorkspaceRole.MEMBER;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const invitedUser = await this.findUserByEmail(email);
            if (!invitedUser) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.BAD_REQUEST, 'Email không tồn tại trong hệ thống');
            }
            const existingMember = await this.findExistingMember(workspaceId, invitedUser.id);
            if (existingMember && existingMember.status === enums_1.MemberStatus.ACTIVE) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_ALREADY_EXISTS, common_1.HttpStatus.BAD_REQUEST, 'Người dùng này đã là thành viên của Workspace');
            }
            const workspace = await this.findOne(workspaceId);
            const inviter = await this.userRepository.findOne({
                where: { id: inviterId },
            });
            const inviteToken = this.generateInviteToken();
            const workspaceMember = await this.createInvitation(queryRunner, workspaceId, invitedUser.id, role, inviteToken);
            await queryRunner.manager.save(workspaceMember);
            const inviteLink = this.generateInviteLink(workspaceId, inviteToken);
            const emailSent = await this.sendInvitationEmail(email, workspace.name, inviter?.username || 'Quản trị viên', role, inviteLink);
            if (!emailSent) {
                await queryRunner.rollbackTransaction();
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.EMAIL_SEND_FAILED, common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'Không thể gửi email mời. Vui lòng thử lại sau.');
            }
            await queryRunner.commitTransaction();
            await this.notificationsService.create({
                userId: invitedUser.id,
                type: notification_entity_1.NotificationType.WORKSPACE_INVITE,
                title: 'Lời mời tham gia Workspace',
                message: `${inviter?.username || 'Ai đó'} đã mời bạn tham gia workspace "${workspace.name}"`,
                metadata: {
                    workspaceId,
                    workspaceName: workspace.name,
                    inviterName: inviter?.username || 'Ai đó',
                    inviteToken,
                    role,
                },
            });
            await this.invalidateWorkspaceLists([invitedUser.id]);
            return workspaceMember;
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
    }
    async acceptInvitation(workspaceId, token, userId) {
        const member = await this.workspaceMemberRepository.findOne({
            where: {
                workspaceId,
                inviteToken: token,
                status: enums_1.MemberStatus.PENDING,
            },
        });
        if (!member) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_TOKEN, common_1.HttpStatus.BAD_REQUEST, 'Lời mời không hợp lệ hoặc đã hết hạn');
        }
        if (member.userId !== userId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.FORBIDDEN, 'Lời mời này không dành cho bạn');
        }
        member.status = enums_1.MemberStatus.ACTIVE;
        member.inviteToken = null;
        const savedMember = await this.workspaceMemberRepository.save(member);
        await this.invalidateWorkspaceLists([userId]);
        return savedMember;
    }
    async getMembers(workspaceId) {
        const workspace = await this.findOne(workspaceId);
        const members = await this.workspaceMemberRepository.find({
            where: { workspaceId },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
        const ownerInList = members.some((m) => m.userId === workspace.ownerId);
        if (!ownerInList) {
            const owner = await this.userRepository.findOne({
                where: { id: workspace.ownerId },
            });
            if (owner) {
                const ownerMember = {
                    id: 'owner-' + workspace.ownerId,
                    workspaceId,
                    userId: workspace.ownerId,
                    role: enums_1.WorkspaceRole.OWNER,
                    status: enums_1.MemberStatus.ACTIVE,
                    inviteToken: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: owner,
                };
                return [ownerMember, ...members];
            }
        }
        return members;
    }
    async removeMember(workspaceId, memberId, requesterId) {
        const workspace = await this.findOne(workspaceId);
        if (workspace.ownerId !== requesterId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.FORBIDDEN, 'Chỉ chủ sở hữu workspace mới có thể xóa thành viên');
        }
        if (memberId === workspace.ownerId) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.FORBIDDEN, common_1.HttpStatus.BAD_REQUEST, 'Không thể xóa chủ sở hữu khỏi workspace');
        }
        const membership = await this.workspaceMemberRepository.findOne({
            where: { workspaceId, userId: memberId },
        });
        if (!membership) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.RESOURCE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND, 'Không tìm thấy thành viên trong workspace');
        }
        await this.workspaceMemberRepository.remove(membership);
        await this.invalidateWorkspaceLists([memberId]);
    }
    async findUserByEmail(email) {
        return this.usersService.findByEmail(email);
    }
    async findExistingMember(workspaceId, userId) {
        return this.workspaceMemberRepository.findOne({
            where: { workspaceId, userId },
        });
    }
    generateInviteToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    generateInviteLink(workspaceId, token) {
        return `${this.app.frontendUrl}/workspaces/${workspaceId}/accept-invite?token=${token}`;
    }
    async createInvitation(queryRunner, workspaceId, userId, role, inviteToken) {
        let workspaceMember = await queryRunner.manager.findOne(entities_1.WorkspaceMember, {
            where: { workspaceId, userId },
        });
        if (workspaceMember) {
            workspaceMember.role = role;
            workspaceMember.status = enums_1.MemberStatus.PENDING;
            workspaceMember.inviteToken = inviteToken;
        }
        else {
            workspaceMember = this.workspaceMemberRepository.create({
                workspaceId,
                userId,
                role,
                status: enums_1.MemberStatus.PENDING,
                inviteToken,
            });
        }
        return workspaceMember;
    }
    async sendInvitationEmail(email, workspaceName, inviterName, role, inviteLink) {
        const roleVi = this.getRoleDisplayName(role);
        return this.mailerService.sendInviteEmail(email, workspaceName, inviterName, roleVi, inviteLink);
    }
    getRoleDisplayName(role) {
        const roleNames = {
            [enums_1.WorkspaceRole.OWNER]: 'Chủ sở hữu',
            [enums_1.WorkspaceRole.ADMIN]: 'Quản trị viên',
            [enums_1.WorkspaceRole.MEMBER]: 'Thành viên',
            [enums_1.WorkspaceRole.OBSERVER]: 'Người quan sát',
        };
        return roleNames[role] || role;
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = WorkspacesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkspaceMember)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(6, (0, common_1.Inject)(config_1.appConfig.KEY)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        users_service_1.UsersService,
        mailer_service_1.MailerService, void 0, notifications_service_1.NotificationsService,
        cache_1.AppCacheService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map