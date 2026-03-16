import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../database/entities';
import { ResponseMessage, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ResponseMessage('Notifications retrieved successfully')
  async findAll(
    @CurrentUser('userId') userId: string,
  ): Promise<Notification[]> {
    return this.notificationsService.findAllByUser(userId);
  }

  @Get('unread-count')
  @ResponseMessage('Unread count retrieved successfully')
  async getUnreadCount(
    @CurrentUser('userId') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @ResponseMessage('Notification marked as read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('mark-all-read')
  @ResponseMessage('All notifications marked as read')
  async markAllAsRead(@CurrentUser('userId') userId: string): Promise<void> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete()
  @ResponseMessage('All notifications deleted successfully')
  async removeAll(@CurrentUser('userId') userId: string): Promise<void> {
    return this.notificationsService.removeAll(userId);
  }

  @Delete(':id')
  @ResponseMessage('Notification deleted successfully')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    return this.notificationsService.remove(id, userId);
  }
}
