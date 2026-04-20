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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisThrottlerStorage = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config");
let RedisThrottlerStorage = class RedisThrottlerStorage {
    redis;
    constructor(redisConfigValues) {
        this.redis = new ioredis_1.default({
            host: redisConfigValues.host,
            port: redisConfigValues.port,
            password: redisConfigValues.password,
            lazyConnect: true,
            maxRetriesPerRequest: 1,
        });
    }
    async increment(key, ttl, limit, blockDuration, throttlerName) {
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
            await this.redis.psetex(blockKey, blockDuration, String(nextBlockedUntil));
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
    async onModuleDestroy() {
        if (this.redis.status !== 'end') {
            await this.redis.quit();
        }
    }
    async ensureConnected() {
        if (this.redis.status === 'wait' || this.redis.status === 'end') {
            await this.redis.connect();
        }
    }
};
exports.RedisThrottlerStorage = RedisThrottlerStorage;
exports.RedisThrottlerStorage = RedisThrottlerStorage = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.redisConfig.KEY)),
    __metadata("design:paramtypes", [void 0])
], RedisThrottlerStorage);
//# sourceMappingURL=redis-throttler.storage.js.map