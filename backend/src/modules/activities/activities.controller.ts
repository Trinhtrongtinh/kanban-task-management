import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { BoardMemberGuard } from '../../common/guards';
import { GetActivitiesQueryDto } from './dto';
import { ReadRateLimit } from '../../common/rate-limit';

@Controller()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('activities/me')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User activities retrieved successfully')
  findRecentByUser(
    @CurrentUser('userId') userId: string,
    @Query() query: GetActivitiesQueryDto,
  ) {
    return this.activitiesService.getActivities(query, userId);
  }

  @Get('boards/:boardId/activities')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @ResponseMessage('Board activities retrieved successfully')
  findBoardActivities(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Query() query: GetActivitiesQueryDto,
  ) {
    return this.activitiesService.getActivities(query, undefined, boardId);
  }
}
