import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Card, List } from '../../database/entities';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import { CardsGateway } from './cards.gateway';

// Default position increment for new cards
const POSITION_GAP = 65535;

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    private readonly dataSource: DataSource,
    private readonly activitiesService: ActivitiesService,
    private readonly cardsGateway: CardsGateway,
  ) {}

  /**
   * Validate list exists
   */
  private async validateListExists(listId: string): Promise<void> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
    });

    if (!list) {
      throw new BusinessException(ErrorCode.LIST_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Calculate position for a new card
   * Gets the last card's position and adds POSITION_GAP
   */
  private async calculateNewPosition(listId: string): Promise<number> {
    const lastCard = await this.cardRepository.findOne({
      where: { listId },
      order: { position: 'DESC' },
    });

    if (!lastCard) {
      return POSITION_GAP;
    }

    return lastCard.position + POSITION_GAP;
  }

  async create(createCardDto: CreateCardDto): Promise<Card> {
    const { title, listId, deadline, ...rest } = createCardDto;

    // Validate list exists
    await this.validateListExists(listId);

    // Calculate position automatically
    const position = await this.calculateNewPosition(listId);

    const card = this.cardRepository.create({
      title,
      listId,
      position,
      deadline: deadline ? new Date(deadline) : null,
      ...rest,
    });

    return this.cardRepository.save(card);
  }

  async findAllByList(listId: string): Promise<Card[]> {
    // Validate list exists
    await this.validateListExists(listId);

    return this.cardRepository.find({
      where: { listId, isArchived: false },
      relations: ['labels'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['list', 'labels'],
    });

    if (!card) {
      throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id);

    const { listId, deadline, ...rest } = updateCardDto;

    // If moving to another list, validate target list exists
    if (listId && listId !== card.listId) {
      await this.validateListExists(listId);
      card.listId = listId;

      // If position is not provided, calculate new position in target list
      if (!updateCardDto.position) {
        card.position = await this.calculateNewPosition(listId);
      }
    }

    // Handle deadline
    if (deadline !== undefined) {
      card.deadline = deadline ? new Date(deadline) : null;
    }

    Object.assign(card, rest);

    return this.cardRepository.save(card);
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);
    await this.cardRepository.remove(card);
  }

  /**
   * Move a card to a target list with position calculation
   * Uses queryRunner for transaction control
   */
  async moveCard(
    id: string,
    moveCardDto: MoveCardDto,
    userId: string,
  ): Promise<Card> {
    const { targetListId, prevCardId, nextCardId } = moveCardDto;

    // Create queryRunner for transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedCard: Card;
    let oldListTitle: string;
    let targetListTitle: string;
    let boardId: string;
    let fromListId: string;
    let isListChanged: boolean;
    let cardTitle: string;

    try {
      // Get the card with current list info
      const card = await queryRunner.manager.findOne(Card, {
        where: { id },
        relations: ['list'],
      });

      if (!card) {
        throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      oldListTitle = card.list.title;
      fromListId = card.listId;
      cardTitle = card.title;

      // Validate target list exists
      const targetList = await queryRunner.manager.findOne(List, {
        where: { id: targetListId },
      });

      if (!targetList) {
        throw new BusinessException(ErrorCode.LIST_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      targetListTitle = targetList.title;
      boardId = targetList.boardId;
      isListChanged = fromListId !== targetListId;

      // Calculate new position based on prevCardId and nextCardId
      let newPosition: number;

      if (!prevCardId && !nextCardId) {
        // No position hints - place at end of target list
        const lastCard = await queryRunner.manager.findOne(Card, {
          where: { listId: targetListId, id: Not(id) }, // Exclude current card
          order: { position: 'DESC' },
        });
        newPosition = lastCard ? lastCard.position + POSITION_GAP : POSITION_GAP;
      } else if (!prevCardId && nextCardId) {
        // Moving to the beginning of the list
        const nextCard = await queryRunner.manager.findOne(Card, {
          where: { id: nextCardId },
        });
        if (!nextCard) {
          throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        newPosition = nextCard.position / 2;
      } else if (prevCardId && !nextCardId) {
        // Moving to the end of the list
        const prevCard = await queryRunner.manager.findOne(Card, {
          where: { id: prevCardId },
        });
        if (!prevCard) {
          throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        newPosition = prevCard.position + POSITION_GAP;
      } else {
        // Moving between two cards
        const [prevCard, nextCard] = await Promise.all([
          queryRunner.manager.findOne(Card, { where: { id: prevCardId } }),
          queryRunner.manager.findOne(Card, { where: { id: nextCardId } }),
        ]);

        if (!prevCard || !nextCard) {
          throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        newPosition = (prevCard.position + nextCard.position) / 2;
      }

      // Update card position and list using UPDATE query
      await queryRunner.manager.update(Card, { id }, {
        listId: targetListId,
        position: newPosition,
      });

      // Fetch updated card
      const updatedCard = await queryRunner.manager.findOne(Card, {
        where: { id },
      });
      if (!updatedCard) {
        throw new NotFoundException(`Card with ID ${id} not found after update`);
      }
      savedCard = updatedCard;

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Only rollback if transaction is still active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      // Release queryRunner
      await queryRunner.release();
    }

    // Log activity AFTER successful commit (outside transaction)
    const logContent = isListChanged
      ? `Đã chuyển thẻ "${savedCard.title}" từ "${oldListTitle}" sang "${targetListTitle}"`
      : `Đã thay đổi vị trí thẻ "${savedCard.title}" trong "${targetListTitle}"`;

    this.activitiesService.createLog({
      userId,
      boardId,
      cardId: savedCard.id,
      action: 'MOVE_CARD',
      content: logContent,
    }).catch(err => console.error('Failed to log activity:', err));

    // Emit real-time event after successful commit
    this.cardsGateway.emitCardMoved(boardId, {
      card: savedCard,
      fromListId,
      toListId: targetListId,
    });

    return savedCard;
  }
}
