import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities';
import { NotificationsGateway } from './notifications.gateway';
import { AppCacheService } from '../../common/cache';
export interface CreateNotificationDto {
    userId: string;
    cardId?: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
}
export declare class NotificationsService {
    private readonly notificationRepository;
    private readonly notificationsGateway;
    private readonly cacheService;
    constructor(notificationRepository: Repository<Notification>, notificationsGateway: NotificationsGateway, cacheService: AppCacheService);
    private invalidateNotificationCache;
    create(dto: CreateNotificationDto): Promise<Notification>;
    findAllByUser(userId: string): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
    removeAll(userId: string): Promise<void>;
    remove(notificationId: string, userId: string): Promise<void>;
}
