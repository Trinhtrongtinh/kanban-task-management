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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const cache_service_1 = require("./common/cache/cache.service");
let AppController = class AppController {
    cacheService;
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    getMetrics() {
        try {
            const snapshot = this.cacheService.getMetricsSnapshot();
            const metricsWithRatios = Object.entries(snapshot).reduce((acc, [group, counters]) => {
                const totalRequests = counters.hit + counters.miss;
                const hitRatio = totalRequests > 0 ? ((counters.hit / totalRequests) * 100).toFixed(2) : '0.00';
                acc[group] = {
                    ...counters,
                    hitRatio: `${hitRatio}%`,
                    totalRequests,
                };
                return acc;
            }, {});
            return {
                timestamp: new Date().toISOString(),
                metrics: metricsWithRatios,
                summary: {
                    totalGroups: Object.keys(metricsWithRatios).length,
                    overallHits: Object.values(metricsWithRatios).reduce((sum, m) => sum + m.hit, 0),
                    overallMisses: Object.values(metricsWithRatios).reduce((sum, m) => sum + m.miss, 0),
                    overallInvalidations: Object.values(metricsWithRatios).reduce((sum, m) => sum + m.invalidate, 0),
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                message: 'Failed to retrieve metrics',
                error: error?.message || 'Unknown error',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('/metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getMetrics", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [cache_service_1.AppCacheService])
], AppController);
//# sourceMappingURL=app.controller.js.map