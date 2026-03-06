import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Workspace, Board, Card, List } from '../../database/entities';
import { GlobalSearchDto, AdvancedSearchDto, DueDateFilter } from './dto';

@Injectable()
export class SearchService {
  // Hardcoded userId for now (skip JWT)
  private readonly currentUserId = '191c2e6a-7cbf-4c15-a016-37233433f1ac';

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
  ) {}

  /**
   * Global search across workspaces, boards, and cards
   * Only returns results the user has access to
   */
  async globalSearch(dto: GlobalSearchDto) {
    const keyword = `%${dto.q}%`;

    // Search Workspaces (user is owner)
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .where('workspace.ownerId = :userId', { userId: this.currentUserId })
      .andWhere('workspace.name LIKE :keyword', { keyword })
      .select([
        'workspace.id',
        'workspace.name',
        'workspace.slug',
        'workspace.type',
      ])
      .getMany();

    // Search Boards (in user's workspaces)
    const boards = await this.boardRepository
      .createQueryBuilder('board')
      .innerJoin('board.workspace', 'workspace')
      .where('workspace.ownerId = :userId', { userId: this.currentUserId })
      .andWhere('board.title LIKE :keyword', { keyword })
      .select([
        'board.id',
        'board.title',
        'board.slug',
        'board.visibility',
        'board.workspaceId',
      ])
      .getMany();

    // Search Cards (in user's boards) - search title OR description
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.list', 'list')
      .innerJoin('list.board', 'board')
      .innerJoin('board.workspace', 'workspace')
      .where('workspace.ownerId = :userId', { userId: this.currentUserId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('card.title LIKE :keyword', { keyword }).orWhere(
            'card.description LIKE :keyword',
            { keyword },
          );
        }),
      )
      .select([
        'card.id',
        'card.title',
        'card.description',
        'card.listId',
        'card.deadline',
        'card.isArchived',
      ])
      .addSelect('list.boardId', 'boardId')
      .leftJoinAndSelect('card.labels', 'labels')
      .getMany();

    return {
      workspaces,
      boards,
      cards,
      total: {
        workspaces: workspaces.length,
        boards: boards.length,
        cards: cards.length,
      },
    };
  }

  /**
   * Advanced search with filters
   * Supports: boardId, labelIds, dueDate
   */
  async advancedSearch(dto: AdvancedSearchDto) {
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.list', 'list')
      .innerJoin('list.board', 'board')
      .innerJoin('board.workspace', 'workspace')
      .where('workspace.ownerId = :userId', { userId: this.currentUserId })
      .andWhere('card.isArchived = :isArchived', { isArchived: false });

    // Filter by boardId
    if (dto.boardId) {
      queryBuilder.andWhere('list.boardId = :boardId', {
        boardId: dto.boardId,
      });
    }

    // Filter by labelIds (cards that have ANY of the specified labels)
    if (dto.labelIds && dto.labelIds.length > 0) {
      queryBuilder
        .innerJoin('card.labels', 'label')
        .andWhere('label.id IN (:...labelIds)', { labelIds: dto.labelIds });
    }

    // Filter by dueDate
    if (dto.dueDate) {
      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      switch (dto.dueDate) {
        case DueDateFilter.OVERDUE:
          queryBuilder.andWhere('card.deadline < :now', { now });
          break;
        case DueDateFilter.DUE_SOON:
          queryBuilder.andWhere('card.deadline >= :now', { now });
          queryBuilder.andWhere('card.deadline <= :sevenDaysLater', {
            sevenDaysLater,
          });
          break;
        case DueDateFilter.NO_DEADLINE:
          queryBuilder.andWhere('card.deadline IS NULL');
          break;
      }
    }

    // Select fields and join labels for result
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
}
