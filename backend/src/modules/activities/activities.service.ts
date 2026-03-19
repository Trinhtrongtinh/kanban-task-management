import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, Board, Card } from '../../database/entities';
import { CreateActivityLogDto, GetActivitiesQueryDto, ActivityTimeFilter } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  /**
   * Validate board exists
   */
  private async validateBoardExists(boardId: string): Promise<void> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new BusinessException(
        ErrorCode.BOARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Validate card exists
   */
  private async validateCardExists(cardId: string): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Create an activity log entry
   * Called by other services when actions are performed
   */
  async logActivity(
    createActivityLogDto: CreateActivityLogDto,
  ): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      userId: createActivityLogDto.userId,
      boardId: createActivityLogDto.boardId || null,
      cardId: createActivityLogDto.cardId || null,
      action: createActivityLogDto.action,
      entityTitle: createActivityLogDto.entityTitle,
      details: createActivityLogDto.details || null,
      content: createActivityLogDto.content || createActivityLogDto.entityTitle,
    });

    return this.activityLogRepository.save(activityLog);
  }

  async createLog(createActivityLogDto: CreateActivityLogDto): Promise<ActivityLog> {
    return this.logActivity(createActivityLogDto);
  }

  private getFilterStartDate(filter: ActivityTimeFilter): Date | null {
    if (filter === ActivityTimeFilter.TODAY) {
      const todayUtcStart = new Date();
      todayUtcStart.setUTCHours(0, 0, 0, 0);
      return todayUtcStart;
    }

    if (filter === ActivityTimeFilter.WEEK) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      return sevenDaysAgo;
    }

    return null;
  }

  async getActivities(
    query: GetActivitiesQueryDto,
    userId?: string,
    boardId?: string,
  ): Promise<{ items: ActivityLog[]; nextCursor: string | null }> {
    if (!userId && !boardId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.BAD_REQUEST,
        'Thiếu userId hoặc boardId để truy vấn activity',
      );
    }

    if (boardId) {
      await this.validateBoardExists(boardId);
    }

    const startDate = this.getFilterStartDate(query.filter);
    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.board', 'board')
      .leftJoinAndSelect('activity.card', 'card')
      .orderBy('activity.createdAt', 'DESC')
      .addOrderBy('activity.id', 'DESC')
      .take(query.limit + 1);

    if (userId) {
      queryBuilder.where('activity.userId = :userId', { userId });
    } else if (boardId) {
      queryBuilder.where('activity.boardId = :boardId', { boardId });
    }

    if (startDate) {
      queryBuilder.andWhere('activity.createdAt >= :startDate', {
        startDate,
      });
    }

    if (query.cursor) {
      queryBuilder.andWhere('activity.createdAt < :cursor', {
        cursor: new Date(query.cursor),
      });
    }

    const activities = await queryBuilder.getMany();
    const items = activities.slice(0, query.limit);
    const nextCursor =
      activities.length > query.limit && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : null;

    return { items, nextCursor };
  }

  /**
   * Get all activities for a board
   */
  async findAllByBoard(boardId: string): Promise<ActivityLog[]> {
    const result = await this.getActivities(
      { filter: ActivityTimeFilter.ALL, limit: 20 },
      undefined,
      boardId,
    );

    return result.items;
  }

  /**
   * Get all activities for a card
   */
  async findAllByCard(cardId: string): Promise<ActivityLog[]> {
    await this.validateCardExists(cardId);

    return this.activityLogRepository.find({
      where: { cardId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        boardId: true,
        cardId: true,
        userId: true,
        action: true,
        content: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    });
  }

  async findRecentByUser(userId: string): Promise<ActivityLog[]> {
    const result = await this.getActivities(
      { filter: ActivityTimeFilter.ALL, limit: 20 },
      userId,
    );

    return result.items;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronCleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const result = await this.activityLogRepository
      .createQueryBuilder()
      .delete()
      .from(ActivityLog)
      .where('created_at < :thirtyDaysAgo', { thirtyDaysAgo })
      .execute();

    if ((result.affected ?? 0) > 0) {
      this.logger.log(`Deleted ${result.affected ?? 0} expired activity logs`);
    }
  }
}
