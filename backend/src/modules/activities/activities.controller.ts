import { Controller, Get, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';

@Controller()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('activities/me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User activities retrieved successfully')
  findRecentByUser(@CurrentUser('userId') userId: string) {
    return this.activitiesService.findRecentByUser(userId);
  }
}
