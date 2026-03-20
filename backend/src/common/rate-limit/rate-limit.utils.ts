import { ExecutionContext } from '@nestjs/common';

function normalizeIp(ipLike: string | string[] | undefined): string {
  if (Array.isArray(ipLike)) {
    return ipLike[0] || 'unknown';
  }

  if (!ipLike) {
    return 'unknown';
  }

  return ipLike.split(',')[0]?.trim() || 'unknown';
}

export function getRequestIp(req: Record<string, any>): string {
  return normalizeIp(req.headers?.['x-forwarded-for'] || req.ip);
}

export function getUserOrIpTracker(req: Record<string, any>): string {
  const userId = req.user?.userId;
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${getRequestIp(req)}`;
}

export function getAuthTargetTracker(
  req: Record<string, any>,
  _context: ExecutionContext,
): string {
  const ip = getRequestIp(req);
  const rawEmail =
    typeof req.body?.email === 'string'
      ? req.body.email
      : typeof req.body?.username === 'string'
        ? req.body.username
        : 'anonymous';

  return `ip:${ip}:target:${rawEmail.trim().toLowerCase() || 'anonymous'}`;
}

export function getShortQueryAwareLimit(context: ExecutionContext): number {
  const request = context.switchToHttp().getRequest<Record<string, any>>();
  const query = typeof request.query?.q === 'string' ? request.query.q.trim() : '';

  return query.length > 0 && query.length < 2 ? 10 : 30;
}