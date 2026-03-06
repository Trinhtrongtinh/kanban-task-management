import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Workspace, Board, Card, List } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, Board, Card, List])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
