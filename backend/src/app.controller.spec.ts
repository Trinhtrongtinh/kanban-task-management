import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppCacheService } from './common/cache/cache.service';

describe('AppController', () => {
  let appController: AppController;
  const cacheService = {
    getMetricsSnapshot: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppCacheService, useValue: cacheService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getMetrics', () => {
    it('should return metrics with ratios and summary', () => {
      cacheService.getMetricsSnapshot.mockReturnValue({
        boards: { hit: 3, miss: 1, set: 2, invalidate: 1 },
      });

      const result = appController.getMetrics();

      expect(result.metrics.boards.hitRatio).toBe('75.00%');
      expect(result.metrics.boards.totalRequests).toBe(4);
      expect(result.summary).toEqual({
        totalGroups: 1,
        overallHits: 3,
        overallMisses: 1,
        overallInvalidations: 1,
      });
    });
  });
});
