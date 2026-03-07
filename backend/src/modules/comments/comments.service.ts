import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, Card } from '../../database/entities';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { CommentsGateway } from './comments.gateway';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly commentsGateway: CommentsGateway,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Validate card exists and return it
   */
  private async getCardWithList(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list'],
    });

    if (!card) {
      throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return card;
  }

  /**
   * Validate card exists
   */
  private async validateCardExists(cardId: string): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Create a new comment
   */
  async create(cardId: string, createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    // Get card with list for boardId
    const card = await this.getCardWithList(cardId);

    const comment = this.commentRepository.create({
      cardId,
      userId,
      content: createCommentDto.content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Return with user info
    const commentWithUser = await this.findOne(savedComment.id);

    // Emit real-time event
    this.commentsGateway.emitCommentCreated(cardId, commentWithUser);

    // Log activity
    await this.activitiesService.createLog({
      userId,
      boardId: card.list.boardId,
      cardId: card.id,
      action: 'ADD_COMMENT',
      content: `Đã thêm một bình luận vào Card "${card.title}"`,
    });

    return commentWithUser;
  }

  /**
   * Get all comments for a card with user info
   */
  async findAllByCard(cardId: string): Promise<Comment[]> {
    // Validate card exists
    await this.validateCardExists(cardId);

    return this.commentRepository.find({
      where: { cardId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        cardId: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    });
  }

  /**
   * Find one comment by ID
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        id: true,
        cardId: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    });

    if (!comment) {
      throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return comment;
  }

  /**
   * Update comment content
   */
  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);

    comment.content = updateCommentDto.content;

    await this.commentRepository.save(comment);

    const updatedComment = await this.findOne(id);

    // Emit real-time event
    this.commentsGateway.emitCommentUpdated(comment.cardId, updatedComment);

    return updatedComment;
  }

  /**
   * Soft delete a comment
   */
  async remove(id: string): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentRepository.softDelete(id);

    // Emit real-time event
    this.commentsGateway.emitCommentDeleted(comment.cardId, id);
  }
}
