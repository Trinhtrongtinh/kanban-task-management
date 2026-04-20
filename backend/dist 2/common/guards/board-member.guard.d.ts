import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BoardMember, Board, Workspace } from '../../database/entities';
export declare class BoardMemberGuard implements CanActivate {
    private reflector;
    private boardMemberRepository;
    private boardRepository;
    private workspaceRepository;
    constructor(reflector: Reflector, boardMemberRepository: Repository<BoardMember>, boardRepository: Repository<Board>, workspaceRepository: Repository<Workspace>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
