import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board, Workspace } from '../../database/entities';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  /**
   * Generate slug from title
   * Example: "Dự án ABC" -> "du-an-abc"
   */
  private generateSlug(title: string): string {
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

  async create(createBoardDto: CreateBoardDto): Promise<Board> {
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

    return this.boardRepository.save(board);
  }

  async findAllByWorkspace(workspaceId: string): Promise<Board[]> {
    // Validate workspace exists
    await this.validateWorkspaceExists(workspaceId);

    return this.boardRepository.find({
      where: { workspaceId },
      relations: ['workspace'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!board) {
      throw new BusinessException(ErrorCode.BOARD_NOT_FOUND, HttpStatus.NOT_FOUND);
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
}
