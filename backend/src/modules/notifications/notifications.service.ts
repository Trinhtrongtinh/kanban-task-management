import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities';
import { NotificationsGateway } from './notifications.gateway';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { AppCacheService, CACHE_TTL, CacheKeys } from '../../common/cache';

export interface CreateNotificationDto {
  userId: string;
  cardId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly cacheService: AppCacheService,
  ) { }

  private async invalidateNotificationCache(userId: string): Promise<void> {
    await this.cacheService.delMany([
      CacheKeys.notificationsByUser(userId),
      CacheKeys.notificationUnreadByUser(userId),
    ]);
  }

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
      metadata: dto.metadata || null,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    await this.invalidateNotificationCache(dto.userId);

    // Emit real-time notification if user is online
    this.notificationsGateway.emitNotification(dto.userId, savedNotification);

    return savedNotification;
  }

  /**
   * Get all notifications for a user
   */
  async findAllByUser(userId: string): Promise<Notification[]> {
    const cacheKey = CacheKeys.notificationsByUser(userId);
    const cached = await this.cacheService.get<Notification[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 notifications
    });

    await this.cacheService.set(
      cacheKey,
      notifications,
      CACHE_TTL.NOTIFICATIONS_BY_USER_SECONDS,
    );

    return notifications;
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = CacheKeys.notificationUnreadByUser(userId);
    const cachedCount = await this.cacheService.get<number>(cacheKey);
    if (cachedCount !== null) {
      return cachedCount;
    }

    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    await this.cacheService.set(
      cacheKey,
      count,
      CACHE_TTL.NOTIFICATION_UNREAD_COUNT_SECONDS,
    );

    return count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new BusinessException(
        ErrorCode.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    notification.isRead = true;
    const updated = await this.notificationRepository.save(notification);

    await this.invalidateNotificationCache(userId);

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

    await this.invalidateNotificationCache(userId);

    // Emit all read status update
    this.notificationsGateway.emitAllNotificationsRead(userId);
  }

  /**
   * Delete all notifications for a user
   */
  async removeAll(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
    await this.invalidateNotificationCache(userId);
  }

  /**
   * Delete a notification
   */
  async remove(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new BusinessException(
        ErrorCode.RESOURCE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationRepository.remove(notification);
    await this.invalidateNotificationCache(userId);
  }
}
