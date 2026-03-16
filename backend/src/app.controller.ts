import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppCacheService } from './common/cache/cache.service';

@Controller()
export class AppController {
  constructor(private readonly cacheService: AppCacheService) {}

  /**
   * Internal metrics endpoint - READ ONLY snapshot of cache performance
   * Usage: GET /metrics (internal staging/monitoring use only)
   * Returns: Real-time hit/miss/invalidation counters grouped by resource type
   *
   * Example response:
   * {
   *   "workspaces": { "hit": 125, "miss": 8, "set": 10, "invalidate": 2 },
   *   "boards": { "hit": 342, "miss": 15, "set": 25, "invalidate": 5 },
   *   "notifications.unread": { "hit": 89, "miss": 3, "set": 15, "invalidate": 12 }
   * }
   */
  @Get('/metrics')
  getMetrics() {
    try {
      const snapshot = this.cacheService.getMetricsSnapshot();
      
      // Calculate hit ratios for each group
      const metricsWithRatios = Object.entries(snapshot).reduce(
        (acc, [group, counters]) => {
          const totalRequests = counters.hit + counters.miss;
          const hitRatio =
            totalRequests > 0 ? ((counters.hit / totalRequests) * 100).toFixed(2) : '0.00';

          acc[group] = {
            ...counters,
            hitRatio: `${hitRatio}%`,
            totalRequests,
          };
          return acc;
        },
        {} as Record<
          string,
          {
            hit: number;
            miss: number;
            set: number;
            invalidate: number;
            hitRatio: string;
            totalRequests: number;
          }
        >,
      );

      return {
        timestamp: new Date().toISOString(),
        metrics: metricsWithRatios,
        summary: {
          totalGroups: Object.keys(metricsWithRatios).length,
          overallHits: Object.values(metricsWithRatios).reduce((sum, m) => sum + m.hit, 0),
          overallMisses: Object.values(metricsWithRatios).reduce(
            (sum, m) => sum + m.miss,
            0,
          ),
          overallInvalidations: Object.values(metricsWithRatios).reduce(
            (sum, m) => sum + m.invalidate,
            0,
          ),
        },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          message: 'Failed to retrieve metrics',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
