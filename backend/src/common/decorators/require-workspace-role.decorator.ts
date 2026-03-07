import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../enums';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';

/**
 * Decorator to specify required workspace roles for an endpoint
 * @param roles - Array of WorkspaceRole that are allowed to access
 * @example @RequireWorkspaceRole(WorkspaceRole.OWNER)
 */
export const RequireWorkspaceRole = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
