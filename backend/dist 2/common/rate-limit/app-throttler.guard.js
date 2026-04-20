"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppThrottlerGuard = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const rate_limit_utils_1 = require("./rate-limit.utils");
let AppThrottlerGuard = class AppThrottlerGuard extends throttler_1.ThrottlerGuard {
    async getTracker(req) {
        return (0, rate_limit_utils_1.getUserOrIpTracker)(req);
    }
    async throwThrottlingException(context, throttlerLimitDetail) {
        const retryAfter = Math.ceil(throttlerLimitDetail.timeToBlockExpire / 1000);
        throw new common_1.HttpException({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
            retryAfter,
        }, common_1.HttpStatus.TOO_MANY_REQUESTS, {
            cause: new throttler_1.ThrottlerException(),
        });
    }
};
exports.AppThrottlerGuard = AppThrottlerGuard;
exports.AppThrottlerGuard = AppThrottlerGuard = __decorate([
    (0, common_1.Injectable)()
], AppThrottlerGuard);
//# sourceMappingURL=app-throttler.guard.js.map