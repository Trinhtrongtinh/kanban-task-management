import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { WorkspaceMember, Workspace } from '../../database/entities';
export declare class WorkspaceMemberGuard implements CanActivate {
    private reflector;
    private workspaceMemberRepository;
    private workspaceRepository;
    constructor(reflector: Reflector, workspaceMemberRepository: Repository<WorkspaceMember>, workspaceRepository: Repository<Workspace>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
