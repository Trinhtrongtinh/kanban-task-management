import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

type CacheMetricCounter = {
  hit: number;
  miss: number;
  set: number;
  invalidate: number;
};

@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly metrics = new Map<string, CacheMetricCounter>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private getGroupFromKey(key: string): string {
    const parts = key.split(':');
    if (parts.length < 2) {
      return 'unknown';
    }

    const resource = parts[1];
    if (resource === 'notifications' && parts[2] === 'unread') {
      return 'notifications.unread';
    }

    return resource;
  }

  private track(
    operation: keyof CacheMetricCounter,
    key: string,
    extra?: string,
  ): void {
    const group = this.getGroupFromKey(key);
    const current = this.metrics.get(group) ?? {
      hit: 0,
      miss: 0,
      set: 0,
      invalidate: 0,
    };

    current[operation] += 1;
    this.metrics.set(group, current);

    const suffix = extra ? ` ${extra}` : '';
    this.logger.debug(
      `[cache] op=${operation} group=${group} key=${key}${suffix}`,
    );
  }

  getMetricsSnapshot(): Record<string, CacheMetricCounter> {
    return Object.fromEntries(this.metrics.entries());
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cache.get<T>(key);
      if (value === undefined || value === null) {
        this.track('miss', key);
        return null;
      }

      this.track('hit', key);
      return value ?? null;
    } catch (error: any) {
      this.logger.warn(`Cache GET failed for key=${key}: ${error?.message || error}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttlSeconds * 1000);
      this.track('set', key, `ttl=${ttlSeconds}s`);
    } catch (error: any) {
      this.logger.warn(`Cache SET failed for key=${key}: ${error?.message || error}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
      this.track('invalidate', key);
    } catch (error: any) {
      this.logger.warn(`Cache DEL failed for key=${key}: ${error?.message || error}`);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await Promise.all(keys.map((key) => this.del(key)));
  }
}
