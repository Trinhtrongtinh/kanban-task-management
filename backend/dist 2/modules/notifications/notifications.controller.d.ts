import { NotificationsService } from './notifications.service';
import { Notification } from '../../database/entities';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    markAsRead(id: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
    removeAll(userId: string): Promise<void>;
    remove(id: string, userId: string): Promise<void>;
}
