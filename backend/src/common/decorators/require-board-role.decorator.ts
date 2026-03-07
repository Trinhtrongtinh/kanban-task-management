import { SetMetadata } from '@nestjs/common';
import { BoardRole } from '../enums';

export const BOARD_ROLES_KEY = 'boardRoles';

/**
 * Decorator to specify required board roles for an endpoint
 * @param roles - Array of BoardRole that are allowed to access
 * @example @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
 */
export const RequireBoardRole = (...roles: BoardRole[]) =>
  SetMetadata(BOARD_ROLES_KEY, roles);
