import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardsGateway } from './cards.gateway';
import { Card, List } from '../../database/entities';
import { LabelsModule } from '../labels/labels.module';
import { ChecklistsModule } from '../checklists/checklists.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, List]),
    LabelsModule,
    ChecklistsModule,
    ActivitiesModule,
  ],
  controllers: [CardsController],
  providers: [CardsService, CardsGateway],
  exports: [CardsService, CardsGateway],
})
export class CardsModule {}
