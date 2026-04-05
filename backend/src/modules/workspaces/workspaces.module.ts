import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import {
  Workspace,
  WorkspaceMember,
  User,
  Board,
  List,
  Card,
  Attachment,
} from '../../database/entities';
import { CommonModule } from '../../common/common.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      User,
      Board,
      List,
      Card,
      Attachment,
    ]),
    CommonModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
