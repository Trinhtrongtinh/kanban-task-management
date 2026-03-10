import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, Board, Card } from '../../database/entities';
import { CreateActivityLogDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

@Injectable()
export class ActivitiesService {
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
  async createLog(
    createActivityLogDto: CreateActivityLogDto,
  ): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      userId: createActivityLogDto.userId,
      boardId: createActivityLogDto.boardId,
      cardId: createActivityLogDto.cardId || null,
      action: createActivityLogDto.action,
      content: createActivityLogDto.content,
    });

    return this.activityLogRepository.save(activityLog);
  }

  /**
   * Get all activities for a board
   */
  async findAllByBoard(boardId: string): Promise<ActivityLog[]> {
    await this.validateBoardExists(boardId);

    return this.activityLogRepository.find({
      where: { boardId },
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
}
