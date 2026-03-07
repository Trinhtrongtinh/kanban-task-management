import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { Workspace, WorkspaceMember, User } from '../../database/entities';
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, WorkspaceRole, MemberStatus } from '../../common/enums';
import { UsersService } from '../users/users.service';
import { MailerService } from '../notifications/mailer.service';

@Injectable()
export class WorkspacesService {
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
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate slug from name
   * Example: "Dự án Tinh" -> "du-an-tinh"
   */
  private generateSlug(name: string): string {
    // Vietnamese character mapping
    const vietnameseMap: Record<string, string> = {
      'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'đ': 'd',
      'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
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
      });

      if (!existingWorkspace || existingWorkspace.id === excludeId) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string): Promise<Workspace> {
    const { name, slug, ...rest } = createWorkspaceDto;

    // Generate slug from name if not provided
    let workspaceSlug = slug || this.generateSlug(name);

    // Ensure slug is unique
    workspaceSlug = await this.ensureUniqueSlug(workspaceSlug);

    const workspace = this.workspaceRepository.create({
      name,
      slug: workspaceSlug,
      ownerId: userId,
      ...rest,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Create workspace member for owner
    const workspaceMember = this.workspaceMemberRepository.create({
      workspaceId: savedWorkspace.id,
      userId,
      role: WorkspaceRole.OWNER,
      status: MemberStatus.ACTIVE,
    });
    await this.workspaceMemberRepository.save(workspaceMember);

    return savedWorkspace;
  }

  async findAllByUser(userId: string): Promise<Workspace[]> {
    // Find workspaces where user is an ACTIVE member
    const memberships = await this.workspaceMemberRepository.find({
      where: { userId, status: MemberStatus.ACTIVE },
      relations: ['workspace', 'workspace.owner'],
    });

    return memberships.map(m => m.workspace);
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
      throw new BusinessException(ErrorCode.WORKSPACE_NOT_FOUND, HttpStatus.NOT_FOUND);
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
        throw new BusinessException(ErrorCode.WORKSPACE_SLUG_EXISTS, HttpStatus.CONFLICT);
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

    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string): Promise<void> {
    const workspace = await this.findOne(id);
    await this.workspaceRepository.remove(workspace);
  }

  /**
   * Invite a member to workspace by email
   */
  async inviteMember(
    workspaceId: string,
    inviteMemberDto: InviteMemberDto,
    inviterId: string,
  ): Promise<WorkspaceMember> {
    const { email, role } = inviteMemberDto;

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
      const existingMember = await this.findExistingMember(workspaceId, invitedUser.id);
      if (existingMember) {
        throw new BusinessException(
          ErrorCode.USER_ALREADY_EXISTS,
          HttpStatus.BAD_REQUEST,
          'Người dùng này đã có trong Workspace',
        );
      }

      // Step 3: Get workspace and inviter info
      const workspace = await this.findOne(workspaceId);
      const inviter = await this.userRepository.findOne({ where: { id: inviterId } });

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

      return workspaceMember;
    } catch (error) {
      await queryRunner.rollbackTransaction();
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

    return this.workspaceMemberRepository.save(member);
  }

  /**
   * Get workspace members
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.workspaceMemberRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/workspaces/${workspaceId}/accept-invite?token=${token}`;
  }

  private async createInvitation(
    queryRunner: any,
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    inviteToken: string,
  ): Promise<WorkspaceMember> {
    const workspaceMember = this.workspaceMemberRepository.create({
      workspaceId,
      userId,
      role,
      status: MemberStatus.PENDING,
      inviteToken,
    });
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
