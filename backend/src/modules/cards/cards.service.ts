import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import {
  Card,
  List,
  BoardMember,
  NotificationType,
  User,
  Attachment,
} from '../../database/entities';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ActivityAction, ErrorCode } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import { CardsGateway } from './cards.gateway';
import { NotificationsService } from '../notifications/notifications.service';

// Default position increment for new cards
const POSITION_GAP = 65535;

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    private readonly dataSource: DataSource,
    private readonly activitiesService: ActivitiesService,
    private readonly cardsGateway: CardsGateway,
    private readonly notificationsService: NotificationsService,
  ) { }

  private async validateAssigneeInBoard(listId: string, userId: string): Promise<void> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['board'],
    });

    if (!list) {
      throw new BusinessException(
        ErrorCode.LIST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const boardMember = await this.boardMemberRepository.findOne({
      where: { boardId: list.boardId, userId },
    });

    if (!boardMember) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Người được gán phải là thành viên của board',
      );
    }
  }

  private async validateMemberInBoard(listId: string, userId: string): Promise<void> {
    await this.validateAssigneeInBoard(listId, userId);
  }

  /**
   * Validate list exists
   */
  private async validateListExists(listId: string): Promise<void> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
    });

    if (!list) {
      throw new BusinessException(
        ErrorCode.LIST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
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

  async create(createCardDto: CreateCardDto, userId: string): Promise<Card> {
    const { title, listId, deadline, assigneeId, ...rest } = createCardDto;

    // Validate list exists
    await this.validateListExists(listId);

    // Calculate position automatically
    const position = await this.calculateNewPosition(listId);

    if (assigneeId) {
      await this.validateAssigneeInBoard(listId, assigneeId);
    }

    const card = this.cardRepository.create({
      title,
      listId,
      position,
      deadline: deadline ? new Date(deadline) : null,
      assigneeId: assigneeId || null,
      ...rest,
    });

    const savedCard = await this.cardRepository.save(card);

    if (assigneeId) {
      await this.cardRepository
        .createQueryBuilder()
        .relation(Card, 'members')
        .of(savedCard.id)
        .add(assigneeId);
    }

    const fullCard = await this.findOne(savedCard.id);
    const boardId = fullCard.list.boardId;
    this.cardsGateway.emitCardCreated(boardId, fullCard);

    // Log activity: card created
    this.activitiesService
      .createLog({
        userId,
        boardId,
        cardId: savedCard.id,
        action: ActivityAction.CREATE_CARD,
        entityTitle: savedCard.title,
        content: `Đã tạo thẻ "${savedCard.title}"`,
      })
      .catch((err) => console.error('Failed to log card creation:', err));

    return fullCard;
  }

  async findAllByList(listId: string): Promise<Card[]> {
    // Validate list exists
    await this.validateListExists(listId);

    return this.cardRepository.find({
      where: { listId, isArchived: false },
      relations: ['labels', 'attachments', 'assignee', 'members'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['list', 'labels', 'attachments', 'assignee', 'members'],
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto, userId: string): Promise<Card> {
    const card = await this.findOne(id);
    const previousAssigneeId = card.assigneeId;

    const { listId, deadline, ...rest } = updateCardDto;
    const targetListId = listId || card.listId;

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

    if (rest.assigneeId !== undefined && rest.assigneeId !== null) {
      await this.validateAssigneeInBoard(targetListId, rest.assigneeId);
    }

    Object.assign(card, rest);

    if (rest.assigneeId !== undefined) {
      if (rest.assigneeId === null) {
        card.members = (card.members || []).filter((m) => m.id !== previousAssigneeId);
      } else {
        const existed = (card.members || []).some((m) => m.id === rest.assigneeId);
        if (!existed) {
          const user = await this.cardRepository.manager.findOne(User, {
            where: { id: rest.assigneeId },
          });
          if (user) {
            card.members = [...(card.members || []), user];
          }
        }
      }
    }
    const updatedCard = await this.cardRepository.save(card);

    // Log deadline change
    if (deadline !== undefined) {
      this.activitiesService
        .createLog({
          userId,
          boardId: card.list.boardId,
          cardId: updatedCard.id,
          action: ActivityAction.UPDATE_CARD,
          entityTitle: updatedCard.title,
          details: {
            field: 'deadline',
            deadline: deadline || null,
          },
          content: deadline
            ? `Đặt hạn chót "${updatedCard.title}" → ${new Date(deadline).toLocaleDateString('vi-VN')}`
            : `Xóa hạn chót "${updatedCard.title}"`,
        })
        .catch((err) => console.error('Failed to log deadline change:', err));
    }

    if (
      rest.assigneeId !== undefined &&
      rest.assigneeId !== null &&
      rest.assigneeId !== previousAssigneeId
    ) {
      this.activitiesService
        .createLog({
          userId,
          boardId: card.list.boardId,
          cardId: updatedCard.id,
          action: ActivityAction.ADD_MEMBER,
          entityTitle: updatedCard.title,
          details: {
            memberUserId: rest.assigneeId,
          },
          content: `Đã thêm thành viên vào thẻ "${updatedCard.title}"`,
        })
        .catch((err) => console.error('Failed to log member add:', err));
    }

    if (
      rest.assigneeId !== undefined &&
      rest.assigneeId !== null &&
      rest.assigneeId !== previousAssigneeId
    ) {
      const boardId = card.list?.boardId;
      this.notificationsService.create({
        userId: rest.assigneeId,
        cardId: updatedCard.id,
        type: NotificationType.CARD_ASSIGNED,
        title: 'Bạn được giao một thẻ mới',
        message: `Bạn được giao thẻ "${updatedCard.title}"`,
        link: boardId
          ? `/b/${boardId}?cardId=${updatedCard.id}&focus=activity`
          : undefined,
        metadata: {
          boardId,
          cardId: updatedCard.id,
          listId: updatedCard.listId,
        },
      }).catch(() => null);
    }

    const fullUpdatedCard = await this.findOne(updatedCard.id);
    const boardIdForEmit = fullUpdatedCard.list.boardId;
    this.cardsGateway.emitCardUpdated(boardIdForEmit, fullUpdatedCard);

    return fullUpdatedCard;
  }

  async addMember(cardId: string, userId: string, addedByUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    await this.validateMemberInBoard(card.listId, userId);

    const hasMember = (card.members || []).some((member) => member.id === userId);
    if (!hasMember) {
      await this.cardRepository
        .createQueryBuilder()
        .relation(Card, 'members')
        .of(cardId)
        .add(userId);

      // Log activity: member added
      if (addedByUserId) {
        this.activitiesService
          .createLog({
            userId: addedByUserId,
            boardId: card.list?.boardId || '',
            cardId,
            action: ActivityAction.ADD_MEMBER,
            entityTitle: card.title,
            details: {
              memberUserId: userId,
            },
            content: `Đã thêm thành viên vào thẻ "${card.title}"`,
          })
          .catch((err) => console.error('Failed to log member add:', err));
      }
    }

    if (!card.assigneeId) {
      await this.cardRepository.update(cardId, { assigneeId: userId });
    }

    this.notificationsService.create({
      userId,
      cardId,
      type: NotificationType.CARD_ASSIGNED,
      title: 'Bạn được thêm vào thẻ',
      message: `Bạn vừa được thêm vào thẻ "${card.title}"`,
      link: card.list?.boardId
        ? `/b/${card.list.boardId}?cardId=${cardId}&focus=activity`
        : undefined,
      metadata: {
        boardId: card.list?.boardId,
        cardId,
      },
    }).catch(() => null);

    const fullCard = await this.findOne(cardId);
    this.cardsGateway.emitCardUpdated(fullCard.list.boardId, fullCard);
    return fullCard;
  }

  async removeMember(cardId: string, userId: string): Promise<Card> {
    const card = await this.findOne(cardId);

    const hasMember = (card.members || []).some((member) => member.id === userId);
    if (hasMember) {
      await this.cardRepository
        .createQueryBuilder()
        .relation(Card, 'members')
        .of(cardId)
        .remove(userId);
    }

    if (card.assigneeId === userId) {
      await this.cardRepository.update(cardId, { assigneeId: null });
    }

    const fullCard = await this.findOne(cardId);
    this.cardsGateway.emitCardUpdated(fullCard.list.boardId, fullCard);
    return fullCard;
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);
    const boardId = card.list.boardId;

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Attachment, { cardId: id });
      await manager.softDelete(Card, { id });
    });

    this.cardsGateway.emitCardDeleted(boardId, id);
  }

  async restore(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['list'],
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!card.deletedAt) {
      return this.findOne(id);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.restore(Card, { id });
      await manager
        .createQueryBuilder()
        .restore()
        .from(Attachment)
        .where('card_id = :cardId', { cardId: id })
        .execute();
    });

    const restoredCard = await this.findOne(id);
    this.cardsGateway.emitCardUpdated(restoredCard.list.boardId, restoredCard);
    return restoredCard;
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
        throw new BusinessException(
          ErrorCode.CARD_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      oldListTitle = card.list.title;
      fromListId = card.listId;
      cardTitle = card.title;

      // Validate target list exists
      const targetList = await queryRunner.manager.findOne(List, {
        where: { id: targetListId },
      });

      if (!targetList) {
        throw new BusinessException(
          ErrorCode.LIST_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
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
        newPosition = lastCard
          ? lastCard.position + POSITION_GAP
          : POSITION_GAP;
      } else if (!prevCardId && nextCardId) {
        // Moving to the beginning of the list
        const nextCard = await queryRunner.manager.findOne(Card, {
          where: { id: nextCardId },
        });
        if (!nextCard) {
          throw new BusinessException(
            ErrorCode.CARD_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }
        newPosition = nextCard.position / 2;
      } else if (prevCardId && !nextCardId) {
        // Moving to the end of the list
        const prevCard = await queryRunner.manager.findOne(Card, {
          where: { id: prevCardId },
        });
        if (!prevCard) {
          throw new BusinessException(
            ErrorCode.CARD_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }
        newPosition = prevCard.position + POSITION_GAP;
      } else {
        // Moving between two cards
        const [prevCard, nextCard] = await Promise.all([
          queryRunner.manager.findOne(Card, { where: { id: prevCardId } }),
          queryRunner.manager.findOne(Card, { where: { id: nextCardId } }),
        ]);

        if (!prevCard || !nextCard) {
          throw new BusinessException(
            ErrorCode.CARD_NOT_FOUND,
            HttpStatus.NOT_FOUND,
          );
        }

        newPosition = (prevCard.position + nextCard.position) / 2;
      }

      // Update card position and list using UPDATE query
      await queryRunner.manager.update(
        Card,
        { id },
        {
          listId: targetListId,
          position: newPosition,
        },
      );

      // Fetch updated card
      const updatedCard = await queryRunner.manager.findOne(Card, {
        where: { id },
      });
      if (!updatedCard) {
        throw new NotFoundException(
          `Card with ID ${id} not found after update`,
        );
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
    // Only log if card moved to a DIFFERENT list (cross-list move)
    // Do NOT log reordering within the same list
    if (isListChanged) {
      const logContent = `Đã chuyển thẻ "${savedCard.title}" từ "${oldListTitle}" sang "${targetListTitle}"`;
      this.activitiesService
        .createLog({
          userId,
          boardId,
          cardId: savedCard.id,
          action: ActivityAction.MOVE_CARD,
          entityTitle: savedCard.title,
          details: {
            fromList: oldListTitle,
            toList: targetListTitle,
          },
          content: logContent,
        })
        .catch((err) => console.error('Failed to log card move:', err));
    }

    // Emit real-time event after successful commit
    this.cardsGateway.emitCardMoved(boardId, {
      card: savedCard,
      fromListId,
      toListId: targetListId,
    });

    return savedCard;
  }
}
