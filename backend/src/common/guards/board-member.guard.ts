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
import { BoardMember } from '../../database/entities';
import { BoardRole } from '../enums';
import { BOARD_ROLES_KEY } from '../decorators';

@Injectable()
export class BoardMemberGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
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

    // Get boardId from params (could be :boardId, :id for board routes)
    // or from body for POST requests like creating lists/cards
    const boardId = request.params.boardId || request.params.id || request.body?.boardId;
    // console.log('BoardId:', boardId);
    if (!boardId) {
      // If no boardId found anywhere, skip board check
      return true;
    }

    // Find user's membership in the board
    const membership = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this board',
      );
    }

    // Attach membership info to request for later use
    request.boardMembership = membership;

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
