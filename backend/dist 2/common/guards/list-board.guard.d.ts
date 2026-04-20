import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BoardMember, Board, List } from '../../database/entities';
export declare class ListBoardGuard implements CanActivate {
    private reflector;
    private boardMemberRepository;
    private listRepository;
    private boardRepository;
    constructor(reflector: Reflector, boardMemberRepository: Repository<BoardMember>, listRepository: Repository<List>, boardRepository: Repository<Board>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
