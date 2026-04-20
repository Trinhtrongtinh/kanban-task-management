import { Repository, DataSource } from 'typeorm';
import { Card, User } from '../../database/entities';
import { MailerService } from './mailer.service';
import { NotificationsGateway } from './notifications.gateway';
export declare class DeadlineReminderService {
    private readonly cardRepository;
    private readonly userRepository;
    private readonly dataSource;
    private readonly mailerService;
    private readonly notificationsGateway;
    private readonly logger;
    private isProcessing;
    constructor(cardRepository: Repository<Card>, userRepository: Repository<User>, dataSource: DataSource, mailerService: MailerService, notificationsGateway: NotificationsGateway);
    checkDeadlines(): Promise<void>;
    private findCardsApproachingDeadline;
    private processCardReminder;
    private createNotificationInTransaction;
    private sendReminderEmail;
    private formatDeadline;
    triggerManualCheck(): Promise<{
        processed: number;
        errors: number;
    }>;
}
