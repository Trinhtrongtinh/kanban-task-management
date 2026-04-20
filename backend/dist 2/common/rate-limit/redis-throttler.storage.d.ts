import { OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import { redisConfig } from '../../config';
interface RateLimitStorageRecord {
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
}
export declare class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
    private readonly redis;
    constructor(redisConfigValues: ConfigType<typeof redisConfig>);
    increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<RateLimitStorageRecord>;
    onModuleDestroy(): Promise<void>;
    private ensureConnected;
}
export {};
