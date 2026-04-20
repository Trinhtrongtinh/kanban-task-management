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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const notifications_gateway_1 = require("./notifications.gateway");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const cache_1 = require("../../common/cache");
let NotificationsService = class NotificationsService {
    notificationRepository;
    notificationsGateway;
    cacheService;
    constructor(notificationRepository, notificationsGateway, cacheService) {
        this.notificationRepository = notificationRepository;
        this.notificationsGateway = notificationsGateway;
        this.cacheService = cacheService;
    }
    async invalidateNotificationCache(userId) {
        await this.cacheService.delMany([
            cache_1.CacheKeys.notificationsByUser(userId),
            cache_1.CacheKeys.notificationUnreadByUser(userId),
        ]);
    }
    async create(dto) {
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
        const savedNotification = await this.notificationRepository.save(notification);
        await this.invalidateNotificationCache(dto.userId);
        this.notificationsGateway.emitNotification(dto.userId, savedNotification);
        return savedNotification;
    }
    async findAllByUser(userId) {
        const cacheKey = cache_1.CacheKeys.notificationsByUser(userId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const notifications = await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        await this.cacheService.set(cacheKey, notifications, cache_1.CACHE_TTL.NOTIFICATIONS_BY_USER_SECONDS);
        return notifications;
    }
    async getUnreadCount(userId) {
        const cacheKey = cache_1.CacheKeys.notificationUnreadByUser(userId);
        const cachedCount = await this.cacheService.get(cacheKey);
        if (cachedCount !== null) {
            return cachedCount;
        }
        const count = await this.notificationRepository.count({
            where: { userId, isRead: false },
        });
        await this.cacheService.set(cacheKey, count, cache_1.CACHE_TTL.NOTIFICATION_UNREAD_COUNT_SECONDS);
        return count;
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.RESOURCE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        notification.isRead = true;
        const updated = await this.notificationRepository.save(notification);
        await this.invalidateNotificationCache(userId);
        this.notificationsGateway.emitNotificationRead(userId, notificationId);
        return updated;
    }
    async markAllAsRead(userId) {
        await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
        await this.invalidateNotificationCache(userId);
        this.notificationsGateway.emitAllNotificationsRead(userId);
    }
    async removeAll(userId) {
        await this.notificationRepository.delete({ userId });
        await this.invalidateNotificationCache(userId);
    }
    async remove(notificationId, userId) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.RESOURCE_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        await this.notificationRepository.remove(notification);
        await this.invalidateNotificationCache(userId);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_gateway_1.NotificationsGateway,
        cache_1.AppCacheService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map