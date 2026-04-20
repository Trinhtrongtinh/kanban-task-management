import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BoardMember, Board, Card } from '../../database/entities';
export declare class CardBoardGuard implements CanActivate {
    private reflector;
    private boardMemberRepository;
    private cardRepository;
    private boardRepository;
    constructor(reflector: Reflector, boardMemberRepository: Repository<BoardMember>, cardRepository: Repository<Card>, boardRepository: Repository<Board>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
