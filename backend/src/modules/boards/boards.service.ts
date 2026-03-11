import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board, Workspace, BoardMember, WorkspaceMember } from '../../database/entities';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, BoardRole, MemberStatus } from '../../common/enums';
import { User } from '../../database/entities';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
  ) { }

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

    // Validate workspace exists
    await this.validateWorkspaceExists(workspaceId);

    // Generate slug from title if not provided
    let boardSlug = slug || this.generateSlug(title);

    // Ensure slug is unique
    boardSlug = await this.ensureUniqueSlug(boardSlug);

    const board = this.boardRepository.create({
      title,
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

    return savedBoard;
  }

  async findAllByWorkspace(workspaceId: string, userId: string): Promise<Board[]> {
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
      .where('board.workspace_id = :workspaceId', { workspaceId });

    // If not owner, only show boards where user is a member
    if (workspace.ownerId !== userId) {
      query
        .innerJoin('board_members', 'bm', 'bm.board_id = board.id')
        .andWhere('bm.user_id = :userId', { userId });
    }

    return query.orderBy('board.created_at', 'DESC').getMany();
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

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const board = await this.findOne(id);

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
      board.title = title;
    }

    Object.assign(board, rest);

    return this.boardRepository.save(board);
  }

  async remove(id: string): Promise<void> {
    const board = await this.findOne(id);
    await this.boardRepository.remove(board);
  }

  async getMembers(boardId: string): Promise<User[]> {
    const boardMembers = await this.boardMemberRepository.find({
      where: { boardId },
      relations: ['user'],
    });
    return boardMembers.map(bm => bm.user);
  }

  async addMember(boardId: string, userId: string): Promise<BoardMember> {
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

    return this.boardMemberRepository.save(newMember);
  }

  async removeMember(boardId: string, userId: string): Promise<void> {
    const existing = await this.boardMemberRepository.findOne({
      where: { boardId, userId }
    });
    if (existing) {
      await this.boardMemberRepository.remove(existing);
    }
  }
}
