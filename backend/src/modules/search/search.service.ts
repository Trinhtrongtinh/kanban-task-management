import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Workspace, Board, Card, List, Comment } from '../../database/entities';
import { GlobalSearchDto, AdvancedSearchDto, DueDateFilter } from './dto';
import { MemberStatus } from '../../common/enums';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * Global search across workspaces, boards, and cards
   * Only returns results the user has access to
   */
  async globalSearch(dto: GlobalSearchDto, userId: string) {
    const keyword = `%${dto.q}%`;

    const accessParams = {
      userId,
      activeStatus: MemberStatus.ACTIVE,
      keyword,
    };

    const [workspaces, boards, lists, cards, comments] = await Promise.all([
      this.workspaceRepository
        .createQueryBuilder('workspace')
        .leftJoin(
          'workspace_members',
          'wm',
          'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus',
          accessParams,
        )
        // FIX 1: Thêm dấu ngoặc đơn () bao quanh câu lệnh OR
        .where('(workspace.ownerId = :userId OR wm.id IS NOT NULL)', { userId })
        .andWhere('workspace.name LIKE :keyword', { keyword })
        .select('workspace.id', 'id')
        .addSelect('workspace.name', 'name')
        .addSelect('workspace.slug', 'slug')
        .addSelect('workspace.type', 'type')
        .addSelect('workspace.updatedAt', 'updatedAt')
        .orderBy('workspace.updatedAt', 'DESC')
        // FIX 2: Đổi take thành limit khi dùng getRawMany
        .limit(8)
        .getRawMany(),

      this.boardRepository
        .createQueryBuilder('board')
        .innerJoin('board.workspace', 'workspace')
        .leftJoin(
          'workspace_members',
          'wm',
          'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus',
          accessParams,
        )
        .leftJoin(
          'board_members',
          'bm',
          'bm.board_id = board.id AND bm.user_id = :userId',
          { userId },
        )
        // FIX 1: Thêm dấu ngoặc đơn ()
        .where(
          '(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)',
          { userId },
        )
        .andWhere('board.title LIKE :keyword', { keyword })
        .select('board.id', 'id')
        .addSelect('board.title', 'title')
        .addSelect('board.slug', 'slug')
        .addSelect('board.visibility', 'visibility')
        .addSelect('board.workspaceId', 'workspaceId')
        .addSelect('workspace.name', 'workspaceName')
        .addSelect('board.updatedAt', 'updatedAt')
        .orderBy('board.updatedAt', 'DESC')
        .limit(10) // Đổi thành limit
        .getRawMany(),

      this.listRepository
        .createQueryBuilder('list')
        .innerJoin('list.board', 'board')
        .innerJoin('board.workspace', 'workspace')
        .leftJoin(
          'workspace_members',
          'wm',
          'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus',
          accessParams,
        )
        .leftJoin(
          'board_members',
          'bm',
          'bm.board_id = board.id AND bm.user_id = :userId',
          { userId },
        )
        // FIX 1: Thêm dấu ngoặc đơn ()
        .where(
          '(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)',
          { userId },
        )
        .andWhere('list.title LIKE :keyword', { keyword })
        .select('list.id', 'id')
        .addSelect('list.title', 'title')
        .addSelect('list.boardId', 'boardId')
        .addSelect('board.title', 'boardTitle')
        .addSelect('board.workspaceId', 'workspaceId')
        .addSelect('workspace.name', 'workspaceName')
        .addSelect('list.updatedAt', 'updatedAt')
        .orderBy('list.updatedAt', 'DESC')
        .limit(10) // Đổi thành limit
        .getRawMany(),

      this.cardRepository
        .createQueryBuilder('card')
        .innerJoin('card.list', 'list')
        .innerJoin('list.board', 'board')
        .innerJoin('board.workspace', 'workspace')
        .leftJoin(
          'workspace_members',
          'wm',
          'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus',
          accessParams,
        )
        .leftJoin(
          'board_members',
          'bm',
          'bm.board_id = board.id AND bm.user_id = :userId',
          { userId },
        )
        // FIX 1: Thêm dấu ngoặc đơn ()
        .where(
          '(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)',
          { userId },
        )
        .andWhere('card.isArchived = :isArchived', { isArchived: false })
        .andWhere(
          new Brackets((qb) => {
            qb.where('card.title LIKE :keyword', { keyword })
              .orWhere('card.description LIKE :keyword', { keyword })
              .orWhere(
                `EXISTS (
                  SELECT 1
                  FROM card_labels cl
                  INNER JOIN labels l ON l.id = cl.label_id
                  WHERE cl.card_id = card.id
                    AND l.name LIKE :keyword
                )`,
                { keyword },
              );
          }),
        )
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
        .limit(12) // Đổi thành limit
        .getRawMany(),

      this.commentRepository
        .createQueryBuilder('comment')
        .innerJoin('comment.card', 'card')
        .innerJoin('card.list', 'list')
        .innerJoin('list.board', 'board')
        .innerJoin('board.workspace', 'workspace')
        .leftJoin(
          'workspace_members',
          'wm',
          'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus',
          accessParams,
        )
        .leftJoin(
          'board_members',
          'bm',
          'bm.board_id = board.id AND bm.user_id = :userId',
          { userId },
        )
        // FIX 1: Thêm dấu ngoặc đơn ()
        .where(
          '(workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL)',
          { userId },
        )
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
        .limit(12) // Đổi thành limit
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
          .getRawMany<{ cardId: string; labelName: string | null }>()
      : [];

    const labelMap = new Map<string, string[]>();
    for (const row of cardLabelsRaw) {
      if (!row.labelName) continue;
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

  /**
   * Advanced search with filters
   * Supports: boardId, labelIds, dueDate
   */
  async advancedSearch(dto: AdvancedSearchDto, userId: string) {
    const queryBuilder = this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.list', 'list')
      .innerJoin('list.board', 'board')
      .innerJoin('board.workspace', 'workspace')
      .leftJoin(
        'workspace_members',
        'wm',
        'wm.workspace_id = workspace.id AND wm.user_id = :userId AND wm.status = :activeStatus',
        { userId, activeStatus: MemberStatus.ACTIVE },
      )
      .leftJoin(
        'board_members',
        'bm',
        'bm.board_id = board.id AND bm.user_id = :userId',
        { userId },
      )
      .where(
        'workspace.ownerId = :userId OR wm.id IS NOT NULL OR bm.id IS NOT NULL',
        { userId },
      )
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
