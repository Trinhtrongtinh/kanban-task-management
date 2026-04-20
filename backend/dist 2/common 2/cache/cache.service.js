"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppCacheService = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
let AppCacheService = AppCacheService_1 = class AppCacheService {
    cache;
    logger = new common_1.Logger(AppCacheService_1.name);
    metrics = new Map();
    constructor(cache) {
        this.cache = cache;
    }
    getGroupFromKey(key) {
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
    track(operation, key, extra) {
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
        this.logger.debug(`[cache] op=${operation} group=${group} key=${key}${suffix}`);
    }
    getMetricsSnapshot() {
        return Object.fromEntries(this.metrics.entries());
    }
    async get(key) {
        try {
            const value = await this.cache.get(key);
            if (value === undefined || value === null) {
                this.track('miss', key);
                return null;
            }
            this.track('hit', key);
            return value ?? null;
        }
        catch (error) {
            this.logger.warn(`Cache GET failed for key=${key}: ${error?.message || error}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            await this.cache.set(key, value, ttlSeconds * 1000);
            this.track('set', key, `ttl=${ttlSeconds}s`);
        }
        catch (error) {
            this.logger.warn(`Cache SET failed for key=${key}: ${error?.message || error}`);
        }
    }
    async del(key) {
        try {
            await this.cache.del(key);
            this.track('invalidate', key);
        }
        catch (error) {
            this.logger.warn(`Cache DEL failed for key=${key}: ${error?.message || error}`);
        }
    }
    async delMany(keys) {
        if (!keys.length)
            return;
        await Promise.all(keys.map((key) => this.del(key)));
    }
};
exports.AppCacheService = AppCacheService;
exports.AppCacheService = AppCacheService = AppCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], AppCacheService);
//# sourceMappingURL=cache.service.js.map