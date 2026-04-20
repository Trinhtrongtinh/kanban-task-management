import {
  Injectable,
  HttpStatus,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import type { ConfigType } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  Workspace,
  WorkspaceMember,
  User,
  Board,
  List,
  Card,
  Attachment,
} from '../../database/entities';
import { NotificationType } from '../../database/entities/notification.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, WorkspaceRole, MemberStatus } from '../../common/enums';
import { UsersService } from '../users/users.service';
import { MailerService } from '../notifications/mailer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppCacheService, CACHE_TTL, CacheKeys } from '../../common/cache';
import { appConfig } from '../../config';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    private readonly notificationsService: NotificationsService,
    private readonly cacheService: AppCacheService,
  ) {}

  private async invalidateWorkspaceLists(userIds: string[]): Promise<void> {
    const keys = Array.from(new Set(userIds)).map((userId) =>
      CacheKeys.workspacesByUser(userId),
    );
    await this.cacheService.delMany(keys);
  }

  private async getActiveMemberUserIds(workspaceId: string): Promise<string[]> {
    const members = await this.workspaceMemberRepository.find({
      where: { workspaceId, status: MemberStatus.ACTIVE },
      select: ['userId'],
    });
    return Array.from(new Set(members.map((member) => member.userId)));
  }

  async onModuleInit(): Promise<void> {
    try {
      const result = await this.workspaceMemberRepository
        .createQueryBuilder()
        .update(WorkspaceMember)
        .set({ role: WorkspaceRole.MEMBER })
        .where('role != :ownerRole', { ownerRole: WorkspaceRole.OWNER })
        .execute();

      if ((result.affected ?? 0) > 0) {
        this.logger.log(
          `Normalized ${result.affected ?? 0} workspace member role(s) to MEMBER`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to normalize workspace member roles: ${error?.message || error}`,
      );
    }
  }

  /**
   * Generate slug from name
   * Example: "Dự án Tinh" -> "du-an-tinh"
   */
  private generateSlug(name: string): string {
    // Vietnamese character mapping
    const vietnameseMap: Record<string, string> = {
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
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by appending a number if necessary
   */
  private async ensureUniqueSlug(
    slug: string,
    excludeId?: string,
  ): Promise<string> {
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

  async create(
    createWorkspaceDto: CreateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    // Validate user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // System rule: each account can only own 1 workspace
    const existingOwnedWorkspace = await this.workspaceRepository.findOne({
      where: { ownerId: userId },
      withDeleted: true,
    });
    if (existingOwnedWorkspace) {
      throw new BusinessException(
        ErrorCode.PLAN_LIMIT_EXCEEDED,
        HttpStatus.FORBIDDEN,
        existingOwnedWorkspace.deletedAt
          ? 'Bạn đã có workspace đã xóa. Hãy khôi phục workspace đó thay vì tạo mới.'
          : 'Mỗi tài khoản chỉ có thể tạo tối đa 1 workspace.',
      );
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
      role: WorkspaceRole.OWNER,
      status: MemberStatus.ACTIVE,
    });
    await this.workspaceMemberRepository.save(workspaceMember);

    await this.invalidateWorkspaceLists([userId]);

    return savedWorkspace;
  }

  async findAllByUser(userId: string): Promise<Workspace[]> {
    const cacheKey = CacheKeys.workspacesByUser(userId);
    const cached = await this.cacheService.get<Workspace[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Find workspaces where user is an ACTIVE member
    const memberships = await this.workspaceMemberRepository.find({
      where: { userId, status: MemberStatus.ACTIVE },
      relations: ['workspace', 'workspace.owner'],
    });

    const workspaceIds = memberships.map((m) => m.workspaceId);
    if (workspaceIds.length === 0) {
      await this.cacheService.set(
        cacheKey,
        [],
        CACHE_TTL.WORKSPACES_BY_USER_SECONDS,
      );
      return [];
    }

    const workspaces = await this.workspaceRepository.find({
      where: { id: In(workspaceIds) },
      relations: ['owner', 'boards'],
      order: { createdAt: 'ASC' },
    });

    const workspaceOrder = new Map(
      workspaceIds.map((id, index) => [id, index]),
    );
    const sortedWorkspaces = workspaces.sort(
      (a, b) =>
        (workspaceOrder.get(a.id) ?? 0) - (workspaceOrder.get(b.id) ?? 0),
    );

    await this.cacheService.set(
      cacheKey,
      sortedWorkspaces,
      CACHE_TTL.WORKSPACES_BY_USER_SECONDS,
    );

    return sortedWorkspaces;
  }

  async findAll(): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      relations: ['owner'],
    });
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new BusinessException(
        ErrorCode.WORKSPACE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return workspace;
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id);

    const { slug, name, ...rest } = updateWorkspaceDto;

    // If slug is provided, ensure it's unique
    if (slug) {
      const uniqueSlug = await this.ensureUniqueSlug(slug, id);
      if (uniqueSlug !== slug) {
        throw new BusinessException(
          ErrorCode.WORKSPACE_SLUG_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
      workspace.slug = slug;
    } else if (name && name !== workspace.name) {
      // If name is updated but slug is not provided, regenerate slug
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

  async remove(id: string, requesterId: string): Promise<void> {
    const workspace = await this.findOne(id);

    if (workspace.ownerId !== requesterId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Chỉ chủ sở hữu workspace mới có thể xóa workspace',
      );
    }

    const memberIds = await this.getActiveMemberUserIds(id);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .softDelete()
        .from(Attachment)
        .where(
          'card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId AND c.deleted_at IS NULL AND l.deleted_at IS NULL AND b.deleted_at IS NULL)',
          { workspaceId: id },
        )
        .execute();

      await manager
        .createQueryBuilder()
        .softDelete()
        .from(Card)
        .where(
          'list_id IN (SELECT l.id FROM lists l INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId AND l.deleted_at IS NULL AND b.deleted_at IS NULL)',
          { workspaceId: id },
        )
        .execute();

      await manager
        .createQueryBuilder()
        .softDelete()
        .from(List)
        .where(
          'board_id IN (SELECT id FROM boards WHERE workspace_id = :workspaceId AND deleted_at IS NULL)',
          {
            workspaceId: id,
          },
        )
        .execute();

      await manager.softDelete(Board, { workspaceId: id });
      await manager.softDelete(Workspace, { id });
    });

    await this.invalidateWorkspaceLists(memberIds);
  }

  async restore(id: string, requesterId: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['owner'],
    });

    if (!workspace) {
      throw new BusinessException(
        ErrorCode.WORKSPACE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (workspace.ownerId !== requesterId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Chỉ chủ sở hữu workspace mới có thể khôi phục workspace',
      );
    }

    if (!workspace.deletedAt) {
      return this.findOne(id);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.restore(Workspace, { id });
      await manager
        .createQueryBuilder()
        .restore()
        .from(Board)
        .where('workspace_id = :workspaceId', { workspaceId: id })
        .execute();
      await manager
        .createQueryBuilder()
        .restore()
        .from(List)
        .where(
          'board_id IN (SELECT id FROM boards WHERE workspace_id = :workspaceId)',
          { workspaceId: id },
        )
        .execute();
      await manager
        .createQueryBuilder()
        .restore()
        .from(Card)
        .where(
          'list_id IN (SELECT l.id FROM lists l INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId)',
          { workspaceId: id },
        )
        .execute();
      await manager
        .createQueryBuilder()
        .restore()
        .from(Attachment)
        .where(
          'card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id INNER JOIN boards b ON l.board_id = b.id WHERE b.workspace_id = :workspaceId)',
          { workspaceId: id },
        )
        .execute();
    });

    const memberIds = await this.getActiveMemberUserIds(id);
    await this.invalidateWorkspaceLists(memberIds);
    return this.findOne(id);
  }

  async findDeletedOwnedByUser(userId: string): Promise<Workspace[]> {
    return this.workspaceRepository
      .find({
        where: { ownerId: userId },
        withDeleted: true,
        order: { updatedAt: 'DESC' },
      })
      .then((items) => items.filter((workspace) => !!workspace.deletedAt));
  }

  /**
   * Invite a member to workspace by email
   */
  async inviteMember(
    workspaceId: string,
    inviteMemberDto: InviteMemberDto,
    inviterId: string,
  ): Promise<WorkspaceMember> {
    const { email } = inviteMemberDto;
    const role = WorkspaceRole.MEMBER;

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Find user by email
      const invitedUser = await this.findUserByEmail(email);
      if (!invitedUser) {
        throw new BusinessException(
          ErrorCode.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
          'Email không tồn tại trong hệ thống',
        );
      }

      // Step 2: Check if user already in workspace
      const existingMember = await this.findExistingMember(
        workspaceId,
        invitedUser.id,
      );
      if (existingMember && existingMember.status === MemberStatus.ACTIVE) {
        throw new BusinessException(
          ErrorCode.USER_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
          'Người dùng này đã là thành viên của Workspace',
        );
      }

      // Step 3: Get workspace and inviter info
      const workspace = await this.findOne(workspaceId);
      const inviter = await this.userRepository.findOne({
        where: { id: inviterId },
      });

      // Step 4: Generate invite token
      const inviteToken = this.generateInviteToken();

      // Step 5: Create invitation with PENDING status
      const workspaceMember = await this.createInvitation(
        queryRunner,
        workspaceId,
        invitedUser.id,
        role,
        inviteToken,
      );

      // Save member before sending email (so we can rollback if email fails)
      await queryRunner.manager.save(workspaceMember);

      // Step 6: Send invitation email
      const inviteLink = this.generateInviteLink(workspaceId, inviteToken);
      const emailSent = await this.sendInvitationEmail(
        email,
        workspace.name,
        inviter?.username || 'Quản trị viên',
        role,
        inviteLink,
      );

      if (!emailSent) {
        // Rollback if email fails
        await queryRunner.rollbackTransaction();
        throw new BusinessException(
          ErrorCode.EMAIL_SEND_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Không thể gửi email mời. Vui lòng thử lại sau.',
        );
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Step 7: Create notification for the invited user
      await this.notificationsService.create({
        userId: invitedUser.id,
        type: NotificationType.WORKSPACE_INVITE,
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
    } catch (error) {
      // Only rollback if transaction is still active (might have been rolled back already)
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Accept invitation and join workspace
   */
  async acceptInvitation(
    workspaceId: string,
    token: string,
    userId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        inviteToken: token,
        status: MemberStatus.PENDING,
      },
    });

    if (!member) {
      throw new BusinessException(
        ErrorCode.INVALID_TOKEN,
        HttpStatus.BAD_REQUEST,
        'Lời mời không hợp lệ hoặc đã hết hạn',
      );
    }

    // Verify the invitation is for the current user
    if (member.userId !== userId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Lời mời này không dành cho bạn',
      );
    }

    // Active the membership
    member.status = MemberStatus.ACTIVE;
    member.inviteToken = null;

    const savedMember = await this.workspaceMemberRepository.save(member);
    await this.invalidateWorkspaceLists([userId]);
    return savedMember;
  }

  /**
   * Get workspace members (including owner)
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    // Get workspace to find owner
    const workspace = await this.findOne(workspaceId);

    // Get all members from workspace_members table
    const members = await this.workspaceMemberRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Check if owner is already in members list
    const ownerInList = members.some((m) => m.userId === workspace.ownerId);

    // If owner not in list, add them
    if (!ownerInList) {
      const owner = await this.userRepository.findOne({
        where: { id: workspace.ownerId },
      });

      if (owner) {
        // Create a virtual member object for owner (not saved to DB)
        const ownerMember = {
          id: 'owner-' + workspace.ownerId,
          workspaceId,
          userId: workspace.ownerId,
          role: WorkspaceRole.OWNER,
          status: MemberStatus.ACTIVE,
          inviteToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: owner,
        } as WorkspaceMember;

        // Put owner at the beginning
        return [ownerMember, ...members];
      }
    }

    return members;
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ): Promise<void> {
    const workspace = await this.findOne(workspaceId);

    if (workspace.ownerId !== requesterId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Chỉ chủ sở hữu workspace mới có thể xóa thành viên',
      );
    }

    if (memberId === workspace.ownerId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.BAD_REQUEST,
        'Không thể xóa chủ sở hữu khỏi workspace',
      );
    }

    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: memberId },
    });

    if (!membership) {
      throw new BusinessException(
        ErrorCode.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Không tìm thấy thành viên trong workspace',
      );
    }

    await this.workspaceMemberRepository.remove(membership);
    await this.invalidateWorkspaceLists([memberId]);
  }

  // ============ PRIVATE HELPER METHODS ============

  private async findUserByEmail(email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
  }

  private async findExistingMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    return this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });
  }

  private generateInviteToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateInviteLink(workspaceId: string, token: string): string {
    return `${this.app.frontendUrl}/workspaces/${workspaceId}/accept-invite?token=${token}`;
  }

  private async createInvitation(
    queryRunner: any,
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    inviteToken: string,
  ): Promise<WorkspaceMember> {
    // Check if there's an existing row (could be PENDING)
    let workspaceMember = await queryRunner.manager.findOne(WorkspaceMember, {
      where: { workspaceId, userId },
    });

    if (workspaceMember) {
      workspaceMember.role = role;
      workspaceMember.status = MemberStatus.PENDING;
      workspaceMember.inviteToken = inviteToken;
    } else {
      workspaceMember = this.workspaceMemberRepository.create({
        workspaceId,
        userId,
        role,
        status: MemberStatus.PENDING,
        inviteToken,
      });
    }

    return workspaceMember;
  }

  private async sendInvitationEmail(
    email: string,
    workspaceName: string,
    inviterName: string,
    role: WorkspaceRole,
    inviteLink: string,
  ): Promise<boolean> {
    const roleVi = this.getRoleDisplayName(role);
    return this.mailerService.sendInviteEmail(
      email,
      workspaceName,
      inviterName,
      roleVi,
      inviteLink,
    );
  }

  private getRoleDisplayName(role: WorkspaceRole): string {
    const roleNames: Record<WorkspaceRole, string> = {
      [WorkspaceRole.OWNER]: 'Chủ sở hữu',
      [WorkspaceRole.ADMIN]: 'Quản trị viên',
      [WorkspaceRole.MEMBER]: 'Thành viên',
      [WorkspaceRole.OBSERVER]: 'Người quan sát',
    };
    return roleNames[role] || role;
  }
}
