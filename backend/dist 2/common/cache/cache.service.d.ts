import type { Cache } from 'cache-manager';
type CacheMetricCounter = {
    hit: number;
    miss: number;
    set: number;
    invalidate: number;
};
export declare class AppCacheService {
    private readonly cache;
    private readonly logger;
    private readonly metrics;
    constructor(cache: Cache);
    private getGroupFromKey;
    private track;
    getMetricsSnapshot(): Record<string, CacheMetricCounter>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
    del(key: string): Promise<void>;
    delMany(keys: string[]): Promise<void>;
}
export {};
