import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { DeadlineReminderService } from './deadline-reminder.service';
import { MailerService } from './mailer.service';
import { Notification, Card, User } from '../../database/entities';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Card, User]),
    ScheduleModule.forRoot(),
    CommonModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    DeadlineReminderService,
    MailerService,
  ],
  exports: [NotificationsService, NotificationsGateway, MailerService],
})
export class NotificationsModule {}
