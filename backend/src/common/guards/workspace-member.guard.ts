import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember, Workspace } from '../../database/entities';
import { WorkspaceRole, MemberStatus } from '../enums';
import { WORKSPACE_ROLES_KEY } from '../decorators';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get workspaceId from params
    const workspaceId = request.params.workspaceId || request.params.id;

    if (!workspaceId) {
      return true;
    }

    // Check if user is owner of the workspace
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      withDeleted: true,
    });

    if (!workspace) {
      throw new ForbiddenException('Workspace not found');
    }

    // Owner has all permissions
    if (workspace.ownerId === userId) {
      request.workspaceRole = WorkspaceRole.OWNER;
      return true;
    }

    // Find user's membership in the workspace (only ACTIVE members)
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this workspace',
      );
    }

    // Attach membership info to request for later use
    request.workspaceMembership = membership;
    request.workspaceRole = membership.role;

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
