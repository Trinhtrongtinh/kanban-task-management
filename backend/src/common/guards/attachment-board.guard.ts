import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment, Board, BoardMember, Card } from '../../database/entities';
import { BoardRole } from '../enums';
import { BOARD_ROLES_KEY } from '../decorators';

@Injectable()
export class AttachmentBoardGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<BoardRole[]>(
      BOARD_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const attachmentId = request.params.id;
    if (!attachmentId) {
      return true;
    }

    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      withDeleted: true,
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const card = await this.cardRepository.findOne({
      where: { id: attachment.cardId },
      relations: ['list'],
      withDeleted: true,
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const boardId = card.list.boardId;

    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['workspace'],
    });

    if (board && board.workspace?.ownerId === userId) {
      request.boardMembership = { userId, boardId, role: BoardRole.ADMIN };
      return true;
    }

    const membership = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this board');
    }

    request.boardMembership = membership;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
