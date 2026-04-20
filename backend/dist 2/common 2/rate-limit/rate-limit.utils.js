"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestIp = getRequestIp;
exports.getUserOrIpTracker = getUserOrIpTracker;
exports.getAuthTargetTracker = getAuthTargetTracker;
exports.getShortQueryAwareLimit = getShortQueryAwareLimit;
function normalizeIp(ipLike) {
    if (Array.isArray(ipLike)) {
        return ipLike[0] || 'unknown';
    }
    if (!ipLike) {
        return 'unknown';
    }
    return ipLike.split(',')[0]?.trim() || 'unknown';
}
function getRequestIp(req) {
    return normalizeIp(req.headers?.['x-forwarded-for'] || req.ip);
}
function getUserOrIpTracker(req) {
    const userId = req.user?.userId;
    if (userId) {
        return `user:${userId}`;
    }
    return `ip:${getRequestIp(req)}`;
}
function getAuthTargetTracker(req, _context) {
    const ip = getRequestIp(req);
    const rawEmail = typeof req.body?.email === 'string'
        ? req.body.email
        : typeof req.body?.username === 'string'
            ? req.body.username
            : 'anonymous';
    return `ip:${ip}:target:${rawEmail.trim().toLowerCase() || 'anonymous'}`;
}
function getShortQueryAwareLimit(context) {
    const request = context.switchToHttp().getRequest();
    const query = typeof request.query?.q === 'string' ? request.query.q.trim() : '';
    return query.length > 0 && query.length < 2 ? 10 : 30;
}
//# sourceMappingURL=rate-limit.utils.js.map