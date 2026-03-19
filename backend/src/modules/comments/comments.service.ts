import { Injectable, HttpStatus, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Comment,
  Card,
  BoardMember,
  NotificationType,
} from '../../database/entities';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, BoardRole, ActivityAction } from '../../common/enums';
import { CommentsGateway } from './comments.gateway';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '../notifications/mailer.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    private readonly commentsGateway: CommentsGateway,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Validate card exists and return it
   */
  private async getCardWithList(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.board'],
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
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
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Create a new comment
   */
  async create(
    cardId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
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

    const requestedMentionIds = createCommentDto.mentionedUserIds || [];
    const candidateMentionIds = requestedMentionIds.filter(
      (mentionedUserId) => mentionedUserId !== userId,
    );

    let mentionedBoardMembers: BoardMember[] = [];
    if (createCommentDto.mentionAll || candidateMentionIds.length > 0) {
      mentionedBoardMembers = await this.boardMemberRepository.find({
        where: createCommentDto.mentionAll
          ? {
              boardId: card.list.boardId,
            }
          : {
              boardId: card.list.boardId,
              userId: In(candidateMentionIds),
            },
        relations: ['user'],
      });

      mentionedBoardMembers = mentionedBoardMembers.filter(
        (member, index, members) =>
          member.userId !== userId &&
          members.findIndex((candidate) => candidate.userId === member.userId) === index,
      );

      for (const mentionedMember of mentionedBoardMembers) {
        const mentionLink = `/b/${card.list.boardId}?cardId=${cardId}&focus=activity&commentId=${commentWithUser.id}`;

        await this.notificationsService
          .create({
            userId: mentionedMember.userId,
            cardId,
            type: NotificationType.MENTION,
            title: 'Bạn được nhắc đến trong bình luận',
            message: `${commentWithUser.user.username} đã nhắc đến bạn trong thẻ "${card.title}"`,
            link: mentionLink,
            metadata: {
              boardId: card.list.boardId,
              cardId,
              commentId: commentWithUser.id,
              fromUserId: userId,
            },
          })
          .catch(() => null);

        if (mentionedMember.user?.email && mentionedMember.user.notifyMentionEmail) {
          this.mailerService
            .sendMentionNotification(
              mentionedMember.user.email,
              mentionedMember.user.username || mentionedMember.user.email,
              commentWithUser.user.username || 'Một người dùng',
              card.title,
              card.list.board?.title || 'Kanban',
              commentWithUser.content,
              mentionLink,
            )
            .catch(() => null);
        }
      }
    }

    // Emit real-time event
    this.commentsGateway.emitCommentCreated(cardId, commentWithUser);

    // Log activity
    const mentionText = mentionedBoardMembers.length
      ? ` (nhắc đến ${mentionedBoardMembers
          .map((member) => `@${member.user?.username || member.userId}`)
          .join(', ')})`
      : '';

    await this.activitiesService.createLog({
      userId,
      boardId: card.list.boardId,
      cardId: card.id,
      action: ActivityAction.COMMENT_ADDED,
      entityTitle: card.title,
      details: {
        commentId: commentWithUser.id,
        mentionedUserIds: mentionedBoardMembers.map((member) => member.userId),
      },
      content: `Đã thêm một bình luận vào Card "${card.title}"${mentionText}`,
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
      order: { createdAt: 'ASC' },
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
      throw new BusinessException(
        ErrorCode.COMMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return comment;
  }

  /**
   * Check if user can modify the comment (owner or board admin)
   */
  private async validateCommentPermission(
    comment: Comment,
    userId: string,
  ): Promise<void> {
    // Owner can always modify their own comment
    if (comment.userId === userId) {
      return;
    }

    // Get card to find boardId
    const card = await this.getCardWithList(comment.cardId);
    const boardId = card.list.boardId;

    // Check if user is board admin
    const membership = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (membership?.role === BoardRole.ADMIN) {
      return;
    }

    throw new ForbiddenException('You can only modify your own comments');
  }

  /**
   * Update comment content
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    // Check permission
    await this.validateCommentPermission(comment, userId);

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
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    // Check permission
    await this.validateCommentPermission(comment, userId);

    await this.commentRepository.softDelete(id);

    // Emit real-time event
    this.commentsGateway.emitCommentDeleted(comment.cardId, id);
  }
}
