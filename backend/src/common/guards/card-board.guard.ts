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
import { BoardMember, Board, Card, List } from '../../database/entities';
import { BoardRole } from '../enums';
import { BOARD_ROLES_KEY } from '../decorators';

/**
 * Guard that checks board membership based on cardId parameter
 * Used for card-related operations where we need to check board permissions
 */
@Injectable()
export class CardBoardGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
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

    // Get cardId from params (could be :cardId or :id)
    const cardId = request.params.cardId || request.params.id;

    if (!cardId) {
      return true;
    }

    // Get card with list to find boardId
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list'],
      withDeleted: true,
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const boardId = card.list.boardId;

    // Check if user is the workspace owner — full access
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['workspace'],
    });
    if (board && board.workspace?.ownerId === userId) {
      request.boardMembership = { userId, boardId, role: BoardRole.ADMIN };
      request.card = card;
      request.boardId = boardId;
      return true;
    }

    // Find user's membership in the board
    const membership = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this board');
    }

    // Attach info to request for later use
    request.boardMembership = membership;
    request.card = card;
    request.boardId = boardId;

    // If no specific roles required, just being a member is enough
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check if user has one of the required roles
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
