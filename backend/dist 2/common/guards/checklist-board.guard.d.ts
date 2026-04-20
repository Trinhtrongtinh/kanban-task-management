import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BoardMember, Board, Checklist, ChecklistItem, Card } from '../../database/entities';
export declare class ChecklistBoardGuard implements CanActivate {
    private reflector;
    private boardMemberRepository;
    private checklistRepository;
    private checklistItemRepository;
    private cardRepository;
    private boardRepository;
    constructor(reflector: Reflector, boardMemberRepository: Repository<BoardMember>, checklistRepository: Repository<Checklist>, checklistItemRepository: Repository<ChecklistItem>, cardRepository: Repository<Card>, boardRepository: Repository<Board>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
