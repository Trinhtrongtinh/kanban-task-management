import { AppCacheService } from './common/cache/cache.service';
export declare class AppController {
    private readonly cacheService;
    constructor(cacheService: AppCacheService);
    getMetrics(): {
        timestamp: string;
        metrics: Record<string, {
            hit: number;
            miss: number;
            set: number;
            invalidate: number;
            hitRatio: string;
            totalRequests: number;
        }>;
        summary: {
            totalGroups: number;
            overallHits: number;
            overallMisses: number;
            overallInvalidations: number;
        };
    };
}
