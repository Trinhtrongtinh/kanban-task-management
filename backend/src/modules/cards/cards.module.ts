import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { Card, List } from '../../database/entities';
import { LabelsModule } from '../labels/labels.module';
import { ChecklistsModule } from '../checklists/checklists.module';

@Module({
  imports: [TypeOrmModule.forFeature([Card, List]), LabelsModule, ChecklistsModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
