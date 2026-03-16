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
import {
  BoardMember,
  Board,
  Checklist,
  ChecklistItem,
  Card,
} from '../../database/entities';
import { BoardRole } from '../enums';
import { BOARD_ROLES_KEY } from '../decorators';

@Injectable()
export class ChecklistBoardGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(Checklist)
    private checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private checklistItemRepository: Repository<ChecklistItem>,
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

    const checklistIdFromParams = request.params.checklistId;
    let checklistId: string | undefined;

    if (checklistIdFromParams) {
      checklistId = checklistIdFromParams;
    } else if (request.route?.path?.startsWith('items/')) {
      const itemId = request.params.id;
      if (!itemId) {
        return true;
      }

      const item = await this.checklistItemRepository.findOne({
        where: { id: itemId },
      });

      if (!item) {
        throw new NotFoundException('Checklist item not found');
      }

      checklistId = item.checklistId;
    } else {
      checklistId = request.params.id;
    }

    if (!checklistId) {
      return true;
    }

    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const card = await this.cardRepository.findOne({
      where: { id: checklist.cardId },
      relations: ['list'],
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
