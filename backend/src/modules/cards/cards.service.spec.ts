import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CardsService } from './cards.service';
import { Card, BoardMember, List, User } from '../../database/entities';
import { ActivitiesService } from '../activities/activities.service';
import { CardsGateway } from './cards.gateway';
import { NotificationsService } from '../notifications/notifications.service';

describe('CardsService', () => {
  let service: CardsService;

  type TransactionManager = {
    softDelete: jest.Mock;
  };

  const cardRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const listRepository = {
    findOne: jest.fn(),
  };

  const boardMemberRepository = {
    findOne: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const activitiesService = {
    createLog: jest.fn().mockResolvedValue(undefined),
  };

  const cardsGateway = {
    emitCardCreated: jest.fn(),
    emitCardUpdated: jest.fn(),
    emitCardDeleted: jest.fn(),
    emitCardMoved: jest.fn(),
  };

  const notificationsService = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: getRepositoryToken(Card), useValue: cardRepository },
        { provide: getRepositoryToken(List), useValue: listRepository },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: boardMemberRepository,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivitiesService, useValue: activitiesService },
        { provide: CardsGateway, useValue: cardsGateway },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(CardsService);
    jest.clearAllMocks();
  });

  it('creates a card and emits creation event', async () => {
    listRepository.findOne.mockResolvedValueOnce({
      id: 'list-1',
      boardId: 'board-1',
    } as List);
    cardRepository.findOne.mockResolvedValueOnce(null);
    cardRepository.findOne.mockResolvedValueOnce({
      id: 'card-1',
      title: 'Task 1',
      list: { boardId: 'board-1' },
      listId: 'list-1',
    } as Card);
    cardRepository.create.mockReturnValue({
      title: 'Task 1',
      listId: 'list-1',
      position: 65535,
      assigneeId: null,
    });
    cardRepository.save.mockResolvedValue({
      id: 'card-1',
      title: 'Task 1',
    } as Card);

    const result = await service.create(
      {
        title: 'Task 1',
        listId: 'list-1',
      } as never,
      'user-1',
    );

    expect(result.list.boardId).toBe('board-1');
    expect(cardsGateway.emitCardCreated).toHaveBeenCalledWith(
      'board-1',
      result,
    );
    expect(activitiesService.createLog).toHaveBeenCalled();
  });

  it('removes a card and emits deletion event', async () => {
    cardRepository.findOne.mockResolvedValue({
      id: 'card-1',
      title: 'Task 1',
      list: { boardId: 'board-1' },
    } as Card);

    const softDelete = jest.fn();
    const manager: TransactionManager = {
      softDelete,
    };
    dataSource.transaction.mockImplementation(
      async (callback: (manager: TransactionManager) => Promise<void>) =>
        callback(manager),
    );

    await service.remove('card-1');

    expect(softDelete).toHaveBeenCalledTimes(2);
    expect(cardsGateway.emitCardDeleted).toHaveBeenCalledWith(
      'board-1',
      'card-1',
    );
  });
});
