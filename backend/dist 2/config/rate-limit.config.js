"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('rateLimit', () => ({
    default: {
        ttlMs: parseInt(process.env.RATE_LIMIT_DEFAULT_TTL_MS || '60000', 10),
        limitAuthenticated: parseInt(process.env.RATE_LIMIT_DEFAULT_AUTH_LIMIT || '600', 10),
        limitAnonymous: parseInt(process.env.RATE_LIMIT_DEFAULT_ANON_LIMIT || '300', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_DEFAULT_BLOCK_MS || '30000', 10),
    },
    auth: {
        ttlMs: parseInt(process.env.RATE_LIMIT_AUTH_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_AUTH_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_AUTH_BLOCK_MS || '300000', 10),
    },
    search: {
        ttlMs: parseInt(process.env.RATE_LIMIT_SEARCH_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_SEARCH_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_SEARCH_BLOCK_MS || '60000', 10),
    },
    upload: {
        ttlMs: parseInt(process.env.RATE_LIMIT_UPLOAD_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_UPLOAD_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_UPLOAD_BLOCK_MS || '300000', 10),
    },
    write: {
        ttlMs: parseInt(process.env.RATE_LIMIT_WRITE_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_WRITE_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_WRITE_BLOCK_MS || '60000', 10),
    },
    dangerous: {
        ttlMs: parseInt(process.env.RATE_LIMIT_DANGEROUS_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_DANGEROUS_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_DANGEROUS_BLOCK_MS || '120000', 10),
    },
    notificationBulk: {
        ttlMs: parseInt(process.env.RATE_LIMIT_NOTIFICATION_BULK_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_NOTIFICATION_BULK_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_NOTIFICATION_BULK_BLOCK_MS || '60000', 10),
    },
    payments: {
        ttlMs: parseInt(process.env.RATE_LIMIT_PAYMENTS_TTL_MS || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_PAYMENTS_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_PAYMENTS_BLOCK_MS || '120000', 10),
    },
    read: {
        ttlMs: parseInt(process.env.RATE_LIMIT_READ_TTL_MS || '60000', 10),
        limitAuthenticated: parseInt(process.env.RATE_LIMIT_READ_AUTH_LIMIT || '10000', 10),
        limitAnonymous: parseInt(process.env.RATE_LIMIT_READ_ANON_LIMIT || '10000', 10),
        blockDurationMs: parseInt(process.env.RATE_LIMIT_READ_BLOCK_MS || '60000', 10),
    },
}));
//# sourceMappingURL=rate-limit.config.js.map