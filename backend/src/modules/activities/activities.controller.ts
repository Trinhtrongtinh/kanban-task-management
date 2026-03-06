import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ResponseMessage } from '../../common/decorators';

@Controller()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Get all activities for a board
   * GET /boards/:boardId/activities
   */
  @Get('boards/:boardId/activities')
  @ResponseMessage('Board activities retrieved successfully')
  findAllByBoard(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.activitiesService.findAllByBoard(boardId);
  }

  /**
   * Get all activities for a card
   * GET /cards/:cardId/activities
   */
  @Get('cards/:cardId/activities')
  @ResponseMessage('Card activities retrieved successfully')
  findAllByCard(@Param('cardId', ParseUUIDPipe) cardId: string) {
    return this.activitiesService.findAllByCard(cardId);
  }
}
