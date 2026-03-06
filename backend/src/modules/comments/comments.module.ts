import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsGateway } from './comments.gateway';
import { Comment, Card } from '../../database/entities';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Card]), ActivitiesModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsGateway],
  exports: [CommentsService, CommentsGateway],
})
export class CommentsModule {}
