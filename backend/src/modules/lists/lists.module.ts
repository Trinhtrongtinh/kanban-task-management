import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { List, Board, Card, Attachment } from '../../database/entities';
import { CommonModule } from '../../common/common.module';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([List, Board, Card, Attachment]),
    CommonModule,
    CardsModule,
  ],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
