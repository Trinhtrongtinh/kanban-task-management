import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityLog, Board, Card } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, Board, Card])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
