import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardMember, Card, List, WorkspaceMember, Workspace } from '../database/entities';
import { BoardMemberGuard, CardBoardGuard, ListBoardGuard, WorkspaceMemberGuard } from './guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([BoardMember, WorkspaceMember, Card, List, Workspace]),
  ],
  providers: [BoardMemberGuard, CardBoardGuard, ListBoardGuard, WorkspaceMemberGuard],
  exports: [BoardMemberGuard, CardBoardGuard, ListBoardGuard, WorkspaceMemberGuard, TypeOrmModule],
})
export class CommonModule {}
