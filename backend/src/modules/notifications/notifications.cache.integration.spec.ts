import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { AppCacheService, CacheKeys } from '../../common/cache';

describe('NotificationsService Cache Integration', () => {
  let service: NotificationsService;
  let notificationRepository: jest.Mocked<Partial<Repository<Notification>>>;
  let gateway: jest.Mocked<Partial<NotificationsGateway>>;
  let cacheService: jest.Mocked<Partial<AppCacheService>>;

  beforeEach(async () => {
    notificationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
    };

    gateway = {
      emitNotification: jest.fn(),
      emitNotificationRead: jest.fn(),
      emitAllNotificationsRead: jest.fn(),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
        {
          provide: NotificationsGateway,
          useValue: gateway,
        },
        {
          provide: AppCacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('uses cached unread count when available', async () => {
    (cacheService.get as jest.Mock).mockResolvedValue(5);

    const count = await service.getUnreadCount('u1');

    expect(count).toBe(5);
    expect(notificationRepository.count).not.toHaveBeenCalled();
  });

  it('sets unread count cache on miss', async () => {
    (cacheService.get as jest.Mock).mockResolvedValue(null);
    (notificationRepository.count as jest.Mock).mockResolvedValue(3);

    const count = await service.getUnreadCount('u1');

    expect(count).toBe(3);
    expect(cacheService.set).toHaveBeenCalledWith(
      CacheKeys.notificationUnreadByUser('u1'),
      3,
      30,
    );
  });

  it('invalidates list and unread cache after markAsRead', async () => {
    const existing = {
      id: 'n1',
      userId: 'u1',
      isRead: false,
      type: NotificationType.MENTION,
      title: 't',
      message: 'm',
    } as Notification;

    (notificationRepository.findOne as jest.Mock).mockResolvedValue(existing);
    (notificationRepository.save as jest.Mock).mockResolvedValue({
      ...existing,
      isRead: true,
    });

    await service.markAsRead('n1', 'u1');

    expect(cacheService.delMany).toHaveBeenCalledWith([
      CacheKeys.notificationsByUser('u1'),
      CacheKeys.notificationUnreadByUser('u1'),
    ]);
    expect(gateway.emitNotificationRead).toHaveBeenCalledWith('u1', 'n1');
  });
});
