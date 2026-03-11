import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardsGateway } from './cards.gateway';
import { BoardMember, Card, List } from '../../database/entities';
import { LabelsModule } from '../labels/labels.module';
import { ChecklistsModule } from '../checklists/checklists.module';
import { ActivitiesModule } from '../activities/activities.module';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, List, BoardMember]),
    LabelsModule,
    ChecklistsModule,
    ActivitiesModule,
    CommonModule,
    NotificationsModule,
  ],
  controllers: [CardsController],
  providers: [CardsService, CardsGateway],
  exports: [CardsService, CardsGateway],
})
export class CardsModule {}
