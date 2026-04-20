import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { Attachment, Board, BoardMember, Card } from '../../database/entities';
export declare class AttachmentBoardGuard implements CanActivate {
    private reflector;
    private attachmentRepository;
    private boardMemberRepository;
    private cardRepository;
    private boardRepository;
    constructor(reflector: Reflector, attachmentRepository: Repository<Attachment>, boardMemberRepository: Repository<BoardMember>, cardRepository: Repository<Card>, boardRepository: Repository<Board>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
