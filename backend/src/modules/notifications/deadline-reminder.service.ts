import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, MoreThan, And } from 'typeorm';
import {
  Card,
  Notification,
  NotificationType,
  User,
} from '../../database/entities';
import { MailerService } from './mailer.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class DeadlineReminderService {
  private readonly logger = new Logger(DeadlineReminderService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly mailerService: MailerService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Cron job runs every 30 minutes
   * Checks for cards with deadlines within 24 hours that haven't been reminded
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkDeadlines(): Promise<void> {
    // Prevent concurrent executions
    if (this.isProcessing) {
      this.logger.warn('Previous deadline check still running, skipping...');
      return;
    }

    this.isProcessing = true;
    this.logger.log('Starting deadline reminder check...');

    try {
      // Calculate time window: now to 24 hours from now
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find cards approaching deadline
      const cardsToRemind = await this.findCardsApproachingDeadline(
        now,
        in24Hours,
      );

      this.logger.log(
        `Found ${cardsToRemind.length} cards approaching deadline`,
      );

      if (cardsToRemind.length === 0) {
        return;
      }

      // Process each card
      let successCount = 0;
      let errorCount = 0;

      for (const card of cardsToRemind) {
        try {
          await this.processCardReminder(card);
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to process reminder for card ${card.id}:`,
            error,
          );
          // Continue processing other cards even if one fails
        }
      }

      this.logger.log(
        `Deadline reminder check completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error('Error during deadline reminder check:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Find cards with deadline within specified time window
   */
  private async findCardsApproachingDeadline(
    from: Date,
    to: Date,
  ): Promise<Card[]> {
    return this.cardRepository.find({
      where: {
        deadline: And(MoreThan(from), LessThan(to)),
        isReminded: false,
        isArchived: false,
      },
      relations: ['list', 'list.board', 'assignee'],
    });
  }

  /**
   * Process reminder for a single card within a transaction
   */
  private async processCardReminder(card: Card): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user to notify (assignee or we could notify board members)
      if (!card.assigneeId) {
        this.logger.debug(`Card ${card.id} has no assignee, skipping reminder`);
        // Still mark as reminded to avoid repeated checks
        await queryRunner.manager.update(Card, card.id, { isReminded: true });
        await queryRunner.commitTransaction();
        return;
      }

      const user =
        card.assignee ||
        (await queryRunner.manager.findOne(User, {
          where: { id: card.assigneeId },
        }));

      if (!user) {
        this.logger.warn(
          `User ${card.assigneeId} not found for card ${card.id}`,
        );
        await queryRunner.manager.update(Card, card.id, { isReminded: true });
        await queryRunner.commitTransaction();
        return;
      }

      const boardName = card.list?.board?.title || 'Unknown Board';
      const cardLink = `/b/${card.list?.boardId}?cardId=${card.id}&focus=activity`;

      // 1. Create notification in database
      const notification = await this.createNotificationInTransaction(
        queryRunner,
        user.id,
        card,
        boardName,
        cardLink,
      );

      // 2. Update card's is_reminded flag
      await queryRunner.manager.update(Card, card.id, { isReminded: true });

      // Commit transaction
      await queryRunner.commitTransaction();

      // 3. Emit real-time notification (after commit, without creating duplicate row)
      this.notificationsGateway.emitNotification(user.id, notification);

      // 4. Send email (non-blocking, errors don't affect the process)
      this.sendReminderEmail(user, card, boardName, cardLink).catch((error) => {
        this.logger.error(
          `Failed to send reminder email to ${user.email}:`,
          error,
        );
      });

      this.logger.log(
        `Reminder processed for card "${card.title}" (${card.id}), user: ${user.email}`,
      );
    } catch (error) {
      // Only rollback if transaction is still active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create notification record within transaction
   */
  private async createNotificationInTransaction(
    queryRunner: any,
    userId: string,
    card: Card,
    boardName: string,
    cardLink: string,
  ): Promise<Notification> {
    const notification = queryRunner.manager.create(Notification, {
      userId,
      cardId: card.id,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Nhắc nhở hạn chót',
      message: `Thẻ "${card.title}" trong board "${boardName}" sẽ đến hạn vào ${this.formatDeadline(card.deadline!)}`,
      link: cardLink,
      isRead: false,
      metadata: {
        boardId: card.list?.boardId,
        cardId: card.id,
        listId: card.listId,
      },
    });

    return queryRunner.manager.save(Notification, notification);
  }

  /**
   * Send reminder email
   */
  private async sendReminderEmail(
    user: User,
    card: Card,
    boardName: string,
    cardLink: string,
  ): Promise<void> {
    if (!user.email) {
      this.logger.warn(`User ${user.id} has no email address`);
      return;
    }

    await this.mailerService.sendDeadlineReminder(
      user.email,
      card.title,
      card.deadline!,
      boardName,
      cardLink,
    );
  }

  private formatDeadline(deadline: Date): string {
    return deadline.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualCheck(): Promise<{
    processed: number;
    errors: number;
  }> {
    this.logger.log('Manual deadline check triggered');

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const cardsToRemind = await this.findCardsApproachingDeadline(
      now,
      in24Hours,
    );

    let processed = 0;
    let errors = 0;

    for (const card of cardsToRemind) {
      try {
        await this.processCardReminder(card);
        processed++;
      } catch (error) {
        errors++;
        this.logger.error(
          `Manual check: Failed to process card ${card.id}:`,
          error,
        );
      }
    }

    return { processed, errors };
  }
}
