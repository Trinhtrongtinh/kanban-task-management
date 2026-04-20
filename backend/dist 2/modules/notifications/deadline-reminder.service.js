"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeadlineReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadlineReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const mailer_service_1 = require("./mailer.service");
const notifications_gateway_1 = require("./notifications.gateway");
let DeadlineReminderService = DeadlineReminderService_1 = class DeadlineReminderService {
    cardRepository;
    userRepository;
    dataSource;
    mailerService;
    notificationsGateway;
    logger = new common_1.Logger(DeadlineReminderService_1.name);
    isProcessing = false;
    constructor(cardRepository, userRepository, dataSource, mailerService, notificationsGateway) {
        this.cardRepository = cardRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.mailerService = mailerService;
        this.notificationsGateway = notificationsGateway;
    }
    async checkDeadlines() {
        if (this.isProcessing) {
            this.logger.warn('Previous deadline check still running, skipping...');
            return;
        }
        this.isProcessing = true;
        this.logger.log('Starting deadline reminder check...');
        try {
            const now = new Date();
            const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const cardsToRemind = await this.findCardsApproachingDeadline(now, in24Hours);
            this.logger.log(`Found ${cardsToRemind.length} cards approaching deadline`);
            if (cardsToRemind.length === 0) {
                return;
            }
            let successCount = 0;
            let errorCount = 0;
            for (const card of cardsToRemind) {
                try {
                    await this.processCardReminder(card);
                    successCount++;
                }
                catch (error) {
                    errorCount++;
                    this.logger.error(`Failed to process reminder for card ${card.id}:`, error);
                }
            }
            this.logger.log(`Deadline reminder check completed. Success: ${successCount}, Errors: ${errorCount}`);
        }
        catch (error) {
            this.logger.error('Error during deadline reminder check:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async findCardsApproachingDeadline(from, to) {
        return this.cardRepository.find({
            where: {
                deadline: (0, typeorm_2.And)((0, typeorm_2.MoreThan)(from), (0, typeorm_2.LessThan)(to)),
                isReminded: false,
                isArchived: false,
            },
            relations: ['list', 'list.board', 'assignee'],
        });
    }
    async processCardReminder(card) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (!card.assigneeId) {
                this.logger.debug(`Card ${card.id} has no assignee, skipping reminder`);
                await queryRunner.manager.update(entities_1.Card, card.id, { isReminded: true });
                await queryRunner.commitTransaction();
                return;
            }
            const user = card.assignee ||
                (await queryRunner.manager.findOne(entities_1.User, {
                    where: { id: card.assigneeId },
                }));
            if (!user) {
                this.logger.warn(`User ${card.assigneeId} not found for card ${card.id}`);
                await queryRunner.manager.update(entities_1.Card, card.id, { isReminded: true });
                await queryRunner.commitTransaction();
                return;
            }
            const boardName = card.list?.board?.title || 'Unknown Board';
            const cardLink = `/b/${card.list?.boardId}?cardId=${card.id}&focus=activity`;
            const notification = await this.createNotificationInTransaction(queryRunner, user.id, card, boardName, cardLink);
            await queryRunner.manager.update(entities_1.Card, card.id, { isReminded: true });
            await queryRunner.commitTransaction();
            this.notificationsGateway.emitNotification(user.id, notification);
            this.sendReminderEmail(user, card, boardName, cardLink).catch((error) => {
                this.logger.error(`Failed to send reminder email to ${user.email}:`, error);
            });
            this.logger.log(`Reminder processed for card "${card.title}" (${card.id}), user: ${user.email}`);
        }
        catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async createNotificationInTransaction(queryRunner, userId, card, boardName, cardLink) {
        const notification = queryRunner.manager.create(entities_1.Notification, {
            userId,
            cardId: card.id,
            type: entities_1.NotificationType.DEADLINE_REMINDER,
            title: 'Nhắc nhở hạn chót',
            message: `Thẻ "${card.title}" trong board "${boardName}" sẽ đến hạn vào ${this.formatDeadline(card.deadline)}`,
            link: cardLink,
            isRead: false,
            metadata: {
                boardId: card.list?.boardId,
                cardId: card.id,
                listId: card.listId,
            },
        });
        return queryRunner.manager.save(entities_1.Notification, notification);
    }
    async sendReminderEmail(user, card, boardName, cardLink) {
        if (!user.email) {
            this.logger.warn(`User ${user.id} has no email address`);
            return;
        }
        if (!user.notifyDueDateEmail) {
            this.logger.debug(`User ${user.id} disabled due date reminder emails, skipping mail send`);
            return;
        }
        await this.mailerService.sendDeadlineReminder(user.email, card.title, card.deadline, boardName, cardLink);
    }
    formatDeadline(deadline) {
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
    async triggerManualCheck() {
        this.logger.log('Manual deadline check triggered');
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const cardsToRemind = await this.findCardsApproachingDeadline(now, in24Hours);
        let processed = 0;
        let errors = 0;
        for (const card of cardsToRemind) {
            try {
                await this.processCardReminder(card);
                processed++;
            }
            catch (error) {
                errors++;
                this.logger.error(`Manual check: Failed to process card ${card.id}:`, error);
            }
        }
        return { processed, errors };
    }
};
exports.DeadlineReminderService = DeadlineReminderService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeadlineReminderService.prototype, "checkDeadlines", null);
exports.DeadlineReminderService = DeadlineReminderService = DeadlineReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        mailer_service_1.MailerService,
        notifications_gateway_1.NotificationsGateway])
], DeadlineReminderService);
//# sourceMappingURL=deadline-reminder.service.js.map