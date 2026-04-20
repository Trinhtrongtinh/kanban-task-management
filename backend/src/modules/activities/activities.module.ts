import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import {
  ActivityLog,
  Board,
  BoardMember,
  Card,
  Workspace,
} from '../../database/entities';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityLog,
      Board,
      Card,
      BoardMember,
      Workspace,
    ]),
    CommonModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
