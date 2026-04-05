import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Board,
  Workspace,
  BoardMember,
  WorkspaceMember,
  List,
  Card,
  Attachment,
} from '../../database/entities';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, BoardRole, MemberStatus, ActivityAction } from '../../common/enums';
import { User } from '../../database/entities';
import { AppCacheService, CACHE_TTL, CacheKeys } from '../../common/cache';
import { isProPlanActive } from '../../common/utils';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

const FREE_PLAN_BOARD_LIMIT = 3;

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly cacheService: AppCacheService,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
  ) { }

  private async getWorkspaceAudienceUserIds(workspaceId: string): Promise<string[]> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      select: ['ownerId'],
    });

    if (!workspace) {
      return [];
    }

    const members = await this.boardRepository.manager.find(WorkspaceMember, {
      where: { workspaceId, status: MemberStatus.ACTIVE },
      select: ['userId'],
    });

    return Array.from(
      new Set([workspace.ownerId, ...members.map((member) => member.userId)]),
    );
  }

  private async invalidateBoardsByWorkspace(workspaceId: string): Promise<void> {
    const userIds = await this.getWorkspaceAudienceUserIds(workspaceId);
    const keys = userIds.flatMap((userId) => {
      const baseKey = CacheKeys.boardsByWorkspaceAndUser(workspaceId, userId);
      return [`${baseKey}:joined:0`, `${baseKey}:joined:1`];
    });
    await this.cacheService.delMany(keys);
  }

  /**
   * Generate slug from title
   * Example: "Dự án ABC" -> "du-an-abc"
   */
  private generateSlug(title: string): string {
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

  /**
   * Validate workspace exists
   */
  private async validateWorkspaceExists(workspaceId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BusinessException(
        ErrorCode.WORKSPACE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async create(createBoardDto: CreateBoardDto, userId: string): Promise<Board> {
    const { title, slug, workspaceId, ...rest } = createBoardDto;
    const normalizedTitle = title.trim();

    // Validate workspace exists and user is the owner
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BusinessException(
        ErrorCode.WORKSPACE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (workspace.ownerId !== userId) {
      throw new BusinessException(
        ErrorCode.WORKSPACE_ACCESS_DENIED,
        HttpStatus.FORBIDDEN,
        'Chỉ người tạo workspace mới có thể tạo bảng',
      );
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
      throw new BusinessException(
        ErrorCode.BOARD_TITLE_EXISTS,
        HttpStatus.CONFLICT,
        'Tên bảng đã tồn tại trong workspace này',
      );
    }

    // Check FREE plan board limit
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && !isProPlanActive(user)) {
      const boardCount = await this.boardRepository.count({ where: { workspaceId } });
      if (boardCount >= FREE_PLAN_BOARD_LIMIT) {
        throw new BusinessException(
          ErrorCode.PLAN_LIMIT_EXCEEDED,
          HttpStatus.FORBIDDEN,
          `Gói Free chỉ cho phép tối đa ${FREE_PLAN_BOARD_LIMIT} bảng. Nâng cấp lên Pro để tạo không giới hạn.`,
        );
      }
    }

    // Generate slug from title if not provided
    let boardSlug = slug || this.generateSlug(title);

    // Ensure slug is unique
    boardSlug = await this.ensureUniqueSlug(boardSlug);

    const board = this.boardRepository.create({
      title: normalizedTitle,
      slug: boardSlug,
      workspaceId,
      ...rest,
    });

    const savedBoard = await this.boardRepository.save(board);

    // Create board member for creator as ADMIN
    const boardMember = this.boardMemberRepository.create({
      boardId: savedBoard.id,
      userId,
      role: BoardRole.ADMIN,
    });
    await this.boardMemberRepository.save(boardMember);

    await this.invalidateBoardsByWorkspace(workspaceId);

    this.activitiesService
      .createLog({
        userId,
        boardId: savedBoard.id,
        action: ActivityAction.CREATE_BOARD,
        entityTitle: savedBoard.title,
        details: {
          workspaceId,
        },
        content: `Đã tạo board "${savedBoard.title}"`,
      })
      .catch(() => null);

    return savedBoard;
  }

  async findAllByWorkspace(
    workspaceId: string,
    userId: string,
    joinedOnly = false,
  ): Promise<Board[]> {
    const cacheKey = `${CacheKeys.boardsByWorkspaceAndUser(workspaceId, userId)}:joined:${joinedOnly ? 1 : 0}`;
    const cached = await this.cacheService.get<Board[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BusinessException(
        ErrorCode.WORKSPACE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const query = this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.workspace', 'workspace')
      .where('board.workspace_id = :workspaceId', { workspaceId })
      .andWhere('board.deleted_at IS NULL');

    // joinedOnly=true: only show boards user joined/invited to
    // joinedOnly=false: preserve old behavior (owner sees all boards)
    if (joinedOnly || workspace.ownerId !== userId) {
      query
        .innerJoin('board_members', 'bm', 'bm.board_id = board.id')
        .andWhere('bm.user_id = :userId', { userId });
    }

    const boards = await query.orderBy('board.created_at', 'DESC').getMany();
    await this.cacheService.set(
      cacheKey,
      boards,
      CACHE_TTL.BOARDS_BY_WORKSPACE_SECONDS,
    );
    return boards;
  }

  async findDeletedByWorkspace(workspaceId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { workspaceId },
      withDeleted: true,
      order: { updatedAt: 'DESC' },
    }).then((boards) => boards.filter((board) => !!board.deletedAt));
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!board) {
      throw new BusinessException(
        ErrorCode.BOARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<Board> {
    const board = await this.findOne(id);
    const previousTitle = board.title;

    const { slug, title, ...rest } = updateBoardDto;

    // If slug is provided, ensure it's unique
    if (slug) {
      const uniqueSlug = await this.ensureUniqueSlug(slug, id);
      if (uniqueSlug !== slug) {
        throw new BusinessException(
          ErrorCode.BOARD_SLUG_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
      board.slug = slug;
    } else if (title && title !== board.title) {
      // If title is updated but slug is not provided, regenerate slug
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
        throw new BusinessException(
          ErrorCode.BOARD_TITLE_EXISTS,
          HttpStatus.CONFLICT,
          'Tên bảng đã tồn tại trong workspace này',
        );
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
        action: ActivityAction.UPDATE_BOARD,
        entityTitle: updatedBoard.title,
        details: {
          oldTitle: previousTitle,
          newTitle: updatedBoard.title,
        },
        content:
          previousTitle !== updatedBoard.title
            ? `Đã đổi tên board từ "${previousTitle}" thành "${updatedBoard.title}"`
            : `Đã cập nhật board "${updatedBoard.title}"`,
      })
      .catch(() => null);

    return updatedBoard;
  }

  async remove(id: string): Promise<void> {
    const board = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .softDelete()
        .from(Attachment)
        .where(
          'card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id WHERE l.board_id = :boardId AND c.deleted_at IS NULL AND l.deleted_at IS NULL)',
          { boardId: id },
        )
        .execute();

      await manager
        .createQueryBuilder()
        .softDelete()
        .from(Card)
        .where('list_id IN (SELECT id FROM lists WHERE board_id = :boardId AND deleted_at IS NULL)', {
          boardId: id,
        })
        .execute();

      await manager.softDelete(List, { boardId: id });
      await manager.softDelete(Board, { id });
    });

    await this.invalidateBoardsByWorkspace(board.workspaceId);
  }

  async restore(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!board) {
      throw new BusinessException(
        ErrorCode.BOARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!board.deletedAt) {
      return this.findOne(id);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.restore(Board, { id });

      await manager
        .createQueryBuilder()
        .restore()
        .from(List)
        .where('board_id = :boardId', { boardId: id })
        .execute();

      await manager
        .createQueryBuilder()
        .restore()
        .from(Card)
        .where('list_id IN (SELECT id FROM lists WHERE board_id = :boardId)', { boardId: id })
        .execute();

      await manager
        .createQueryBuilder()
        .restore()
        .from(Attachment)
        .where(
          'card_id IN (SELECT c.id FROM cards c INNER JOIN lists l ON c.list_id = l.id WHERE l.board_id = :boardId)',
          { boardId: id },
        )
        .execute();
    });

    await this.invalidateBoardsByWorkspace(board.workspaceId);
    return this.findOne(id);
  }

  async getMembers(boardId: string): Promise<(User & { role: string })[]> {
    const boardMembers = await this.boardMemberRepository.find({
      where: { boardId },
      relations: ['user'],
    });
    return boardMembers.map(bm => ({ ...bm.user, role: bm.role }));
  }

  async addMember(boardId: string, userId: string, actorId: string): Promise<BoardMember> {
    const board = await this.findOne(boardId);

    // Check if user is in workspace
    const workspaceMember = await this.boardRepository.manager.findOne(WorkspaceMember, {
      where: { workspaceId: board.workspaceId, userId, status: MemberStatus.ACTIVE },
    });

    if (!workspaceMember) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Thành viên phải thuộc Workspace mới có thể thêm vào bảng'
      );
    }

    const existing = await this.boardMemberRepository.findOne({
      where: { boardId, userId }
    });

    if (existing) {
      throw new BusinessException(
        ErrorCode.USER_ALREADY_EXISTS,
        HttpStatus.BAD_REQUEST,
        'Người dùng đã ở trong bảng này'
      );
    }

    const newMember = this.boardMemberRepository.create({
      boardId,
      userId,
      role: BoardRole.EDITOR
    });

    const savedMember = await this.boardMemberRepository.save(newMember);
    await this.invalidateBoardsByWorkspace(board.workspaceId);

    // Fetch actor name for a human-friendly notification message
    const actor = await this.userRepository.findOne({
      where: { id: actorId },
      select: ['username', 'email'],
    });
    const actorName = actor?.username || actor?.email || 'Ai đó';

    // Send real-time notification to the invited user
    this.notificationsService
      .create({
        userId,
        type: NotificationType.BOARD_MEMBER_ADDED,
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
        action: ActivityAction.ADD_MEMBER,
        entityTitle: board.title,
        details: {
          memberUserId: userId,
        },
        content: `Đã thêm thành viên vào board "${board.title}"`,
      })
      .catch(() => null);

    return savedMember;
  }

  async removeMember(boardId: string, userId: string, actorId: string): Promise<void> {
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
          action: ActivityAction.REMOVE_MEMBER,
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
}
