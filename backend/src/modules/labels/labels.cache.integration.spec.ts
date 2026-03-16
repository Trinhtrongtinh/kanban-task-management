import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label, Board, Card } from '../../database/entities';
import { LabelsService } from './labels.service';
import { AppCacheService, CacheKeys } from '../../common/cache';

describe('LabelsService Cache Integration', () => {
  let service: LabelsService;
  let labelRepository: jest.Mocked<Partial<Repository<Label>>>;
  let boardRepository: jest.Mocked<Partial<Repository<Board>>>;
  let cardRepository: jest.Mocked<Partial<Repository<Card>>>;
  let cacheService: jest.Mocked<Partial<AppCacheService>>;

  beforeEach(async () => {
    labelRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    boardRepository = {
      findOne: jest.fn(),
    };

    cardRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelsService,
        { provide: getRepositoryToken(Label), useValue: labelRepository },
        { provide: getRepositoryToken(Board), useValue: boardRepository },
        { provide: getRepositoryToken(Card), useValue: cardRepository },
        { provide: AppCacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<LabelsService>(LabelsService);
  });

  it('returns cached board labels when cache hit', async () => {
    const cached = [{ id: 'l1', boardId: 'b1', name: 'bug' }] as unknown as Label[];
    (cacheService.get as jest.Mock).mockResolvedValue(cached);

    const result = await service.findAllByBoard('b1');

    expect(result).toEqual(cached);
    expect(boardRepository.findOne).not.toHaveBeenCalled();
    expect(labelRepository.find).not.toHaveBeenCalled();
  });

  it('stores labels in cache on miss', async () => {
    (cacheService.get as jest.Mock).mockResolvedValue(null);
    (boardRepository.findOne as jest.Mock).mockResolvedValue({ id: 'b1' });
    (labelRepository.find as jest.Mock).mockResolvedValue([{ id: 'l1' }]);

    await service.findAllByBoard('b1');

    expect(cacheService.set).toHaveBeenCalledWith(
      CacheKeys.labelsByBoard('b1'),
      [{ id: 'l1' }],
      120,
    );
  });

  it('invalidates board labels cache after create', async () => {
    (boardRepository.findOne as jest.Mock).mockResolvedValue({ id: 'b1' });
    (labelRepository.create as jest.Mock).mockReturnValue({
      boardId: 'b1',
      name: 'urgent',
      colorCode: '#f00',
    });
    (labelRepository.save as jest.Mock).mockResolvedValue({ id: 'l2', boardId: 'b1' });

    await service.create({ boardId: 'b1', name: 'urgent', colorCode: '#f00' });

    expect(cacheService.del).toHaveBeenCalledWith(CacheKeys.labelsByBoard('b1'));
  });
});
