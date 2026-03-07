import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities';
import { NotificationsGateway } from './notifications.gateway';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

export interface CreateNotificationDto {
  userId: string;
  cardId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification and emit via WebSocket
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      cardId: dto.cardId || null,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      link: dto.link || null,
      isRead: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Emit real-time notification if user is online
    this.notificationsGateway.emitNotification(dto.userId, savedNotification);

    return savedNotification;
  }

  /**
   * Get all notifications for a user
   */
  async findAllByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 notifications
    });
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    notification.isRead = true;
    const updated = await this.notificationRepository.save(notification);

    // Emit read status update
    this.notificationsGateway.emitNotificationRead(userId, notificationId);

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    // Emit all read status update
    this.notificationsGateway.emitAllNotificationsRead(userId);
  }

  /**
   * Delete a notification
   */
  async remove(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.notificationRepository.remove(notification);
  }
}
