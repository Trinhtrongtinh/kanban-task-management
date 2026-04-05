import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import {
  Board,
  Workspace,
  BoardMember,
  User,
  List,
  Card,
  Attachment,
} from '../../database/entities';
import { CommonModule } from '../../common/common.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      Workspace,
      BoardMember,
      User,
      List,
      Card,
      Attachment,
    ]),
    ActivitiesModule,
    CommonModule,
    NotificationsModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
