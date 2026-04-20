import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { redisConfig } from '../../config';

interface RateLimitStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly redis: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    redisConfigValues: ConfigType<typeof redisConfig>,
  ) {
    this.redis = new Redis({
      host: redisConfigValues.host,
      port: redisConfigValues.port,
      password: redisConfigValues.password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<RateLimitStorageRecord> {
    await this.ensureConnected();

    const now = Date.now();
    const hitsKey = `throttle:${throttlerName}:hits:${key}`;
    const blockKey = `throttle:${throttlerName}:block:${key}`;

    const pipeline = this.redis.multi();
    pipeline.incr(hitsKey);
    pipeline.pttl(hitsKey);
    pipeline.get(blockKey);
    const results = await pipeline.exec();

    const totalHits = Number(results?.[0]?.[1] || 0);
    let timeToExpire = Number(results?.[1]?.[1] || 0);
    const blockedUntil = Number(results?.[2]?.[1] || 0);

    if (timeToExpire < 0) {
      await this.redis.pexpire(hitsKey, ttl);
      timeToExpire = ttl;
    }

    let isBlocked = blockedUntil > now;
    let timeToBlockExpire = isBlocked ? blockedUntil - now : 0;

    if (!isBlocked && totalHits > limit) {
      const nextBlockedUntil = now + blockDuration;
      await this.redis.psetex(
        blockKey,
        blockDuration,
        String(nextBlockedUntil),
      );
      isBlocked = true;
      timeToBlockExpire = blockDuration;
    }

    return {
      totalHits,
      timeToExpire: Math.max(0, timeToExpire),
      isBlocked,
      timeToBlockExpire: Math.max(0, timeToBlockExpire),
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.redis.status === 'wait' || this.redis.status === 'end') {
      await this.redis.connect();
    }
  }
}
