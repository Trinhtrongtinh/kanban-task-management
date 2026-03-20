import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Attachment,
  BoardMember,
  Board,
  Card,
  Checklist,
  ChecklistItem,
  List,
  WorkspaceMember,
  Workspace,
} from '../database/entities';
import { AppCacheService } from './cache';
import {
  AttachmentBoardGuard,
  BoardMemberGuard,
  CardBoardGuard,
  ChecklistBoardGuard,
  ListBoardGuard,
  WorkspaceMemberGuard,
} from './guards';
import {
  AppThrottlerGuard,
  RedisThrottlerStorage,
} from './rate-limit';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardMember,
      Board,
      WorkspaceMember,
      Card,
      Checklist,
      ChecklistItem,
      Attachment,
      List,
      Workspace,
    ]),
  ],
  providers: [
    AppCacheService,
    AttachmentBoardGuard,
    AppThrottlerGuard,
    BoardMemberGuard,
    CardBoardGuard,
    ChecklistBoardGuard,
    ListBoardGuard,
    RedisThrottlerStorage,
    WorkspaceMemberGuard,
  ],
  exports: [
    AppCacheService,
    AttachmentBoardGuard,
    AppThrottlerGuard,
    BoardMemberGuard,
    CardBoardGuard,
    ChecklistBoardGuard,
    ListBoardGuard,
    RedisThrottlerStorage,
    WorkspaceMemberGuard,
    TypeOrmModule,
  ],
})
export class CommonModule { }
