import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Workspace, WorkspaceMember, User } from '../../database/entities';
import { WorkspacesService } from './workspaces.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../notifications/mailer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppCacheService, CacheKeys } from '../../common/cache';

describe('WorkspacesService Cache Integration', () => {
  let service: WorkspacesService;
  let workspaceRepository: jest.Mocked<Partial<Repository<Workspace>>>;
  let workspaceMemberRepository: jest.Mocked<Partial<Repository<WorkspaceMember>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let cacheService: jest.Mocked<Partial<AppCacheService>>;

  beforeEach(async () => {
    workspaceRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    workspaceMemberRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      }),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepository },
        { provide: getRepositoryToken(WorkspaceMember), useValue: workspaceMemberRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
        { provide: UsersService, useValue: { findByEmail: jest.fn() } },
        { provide: MailerService, useValue: { sendInviteEmail: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: AppCacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  it('returns cached workspace list when available', async () => {
    const cached = [{ id: 'w1' }] as Workspace[];
    (cacheService.get as jest.Mock).mockResolvedValue(cached);

    const result = await service.findAllByUser('u1');

    expect(result).toEqual(cached);
    expect(workspaceMemberRepository.find).not.toHaveBeenCalled();
  });

  it('invalidates workspace list cache for active members after update', async () => {
    const workspace = {
      id: 'w1',
      ownerId: 'u-owner',
      name: 'Workspace A',
      slug: 'workspace-a',
    } as Workspace;

    (workspaceRepository.findOne as jest.Mock).mockResolvedValue(workspace);
    (workspaceRepository.save as jest.Mock).mockResolvedValue(workspace);
    (workspaceMemberRepository.find as jest.Mock).mockResolvedValue([
      { userId: 'u-owner' },
      { userId: 'u2' },
    ]);

    await service.update('w1', { description: 'Updated' });

    expect(cacheService.delMany).toHaveBeenCalledWith([
      CacheKeys.workspacesByUser('u-owner'),
      CacheKeys.workspacesByUser('u2'),
    ]);
  });
});
