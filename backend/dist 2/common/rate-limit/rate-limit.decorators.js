"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadRateLimit = exports.PaymentRateLimit = exports.NotificationBulkRateLimit = exports.DangerousWriteRateLimit = exports.WriteRateLimit = exports.UploadRateLimit = exports.SearchRateLimit = exports.ResetPasswordRateLimit = exports.VerifyResetTokenRateLimit = exports.ForgotPasswordRateLimit = exports.RegisterRateLimit = exports.LoginRateLimit = void 0;
const throttler_1 = require("@nestjs/throttler");
const rate_limit_utils_1 = require("./rate-limit.utils");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const LoginRateLimit = () => (0, throttler_1.Throttle)({
    auth: {
        limit: 5,
        ttl: MINUTE,
        blockDuration: 5 * MINUTE,
        getTracker: rate_limit_utils_1.getAuthTargetTracker,
    },
});
exports.LoginRateLimit = LoginRateLimit;
const RegisterRateLimit = () => (0, throttler_1.Throttle)({
    auth: {
        limit: 3,
        ttl: 10 * MINUTE,
        blockDuration: 30 * MINUTE,
        getTracker: rate_limit_utils_1.getAuthTargetTracker,
    },
});
exports.RegisterRateLimit = RegisterRateLimit;
const ForgotPasswordRateLimit = () => (0, throttler_1.Throttle)({
    auth: {
        limit: 3,
        ttl: HOUR,
        blockDuration: HOUR,
        getTracker: rate_limit_utils_1.getAuthTargetTracker,
    },
});
exports.ForgotPasswordRateLimit = ForgotPasswordRateLimit;
const VerifyResetTokenRateLimit = () => (0, throttler_1.Throttle)({
    auth: {
        limit: 10,
        ttl: MINUTE,
        blockDuration: 10 * MINUTE,
        getTracker: rate_limit_utils_1.getAuthTargetTracker,
    },
});
exports.VerifyResetTokenRateLimit = VerifyResetTokenRateLimit;
const ResetPasswordRateLimit = () => (0, throttler_1.Throttle)({
    auth: {
        limit: 5,
        ttl: 10 * MINUTE,
        blockDuration: 30 * MINUTE,
        getTracker: rate_limit_utils_1.getAuthTargetTracker,
    },
});
exports.ResetPasswordRateLimit = ResetPasswordRateLimit;
const SearchRateLimit = () => (0, throttler_1.Throttle)({
    search: {
        limit: rate_limit_utils_1.getShortQueryAwareLimit,
        ttl: MINUTE,
        blockDuration: MINUTE,
    },
});
exports.SearchRateLimit = SearchRateLimit;
const UploadRateLimit = () => (0, throttler_1.Throttle)({
    upload: {
        limit: 20,
        ttl: MINUTE,
        blockDuration: 5 * MINUTE,
    },
});
exports.UploadRateLimit = UploadRateLimit;
const WriteRateLimit = () => (0, throttler_1.Throttle)({
    write: {
        limit: 120,
        ttl: MINUTE,
        blockDuration: MINUTE,
    },
});
exports.WriteRateLimit = WriteRateLimit;
const DangerousWriteRateLimit = () => (0, throttler_1.Throttle)({
    dangerous: {
        limit: 20,
        ttl: MINUTE,
        blockDuration: 2 * MINUTE,
    },
});
exports.DangerousWriteRateLimit = DangerousWriteRateLimit;
const NotificationBulkRateLimit = () => (0, throttler_1.Throttle)({
    notificationBulk: {
        limit: 10,
        ttl: MINUTE,
        blockDuration: MINUTE,
    },
});
exports.NotificationBulkRateLimit = NotificationBulkRateLimit;
const PaymentRateLimit = () => (0, throttler_1.Throttle)({
    payments: {
        limit: 30,
        ttl: MINUTE,
        blockDuration: 2 * MINUTE,
    },
});
exports.PaymentRateLimit = PaymentRateLimit;
const ReadRateLimit = () => (0, throttler_1.Throttle)({
    read: {
        limit: 300,
        ttl: MINUTE,
        blockDuration: MINUTE,
    },
});
exports.ReadRateLimit = ReadRateLimit;
//# sourceMappingURL=rate-limit.decorators.js.map