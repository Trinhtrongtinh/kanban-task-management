import type { AuthUser } from '@/api/auth';
import { parseApiDate } from '@/lib/date-time';

export function isProPlanActive(user: AuthUser | null | undefined): boolean {
  if (!user || user.planType !== 'PRO') {
    return false;
  }

  if (!user.expiredAt) {
    return true;
  }

  return parseApiDate(user.expiredAt).getTime() > Date.now();
}

export function getEffectivePlanType(user: AuthUser | null | undefined): 'FREE' | 'PRO' {
  return isProPlanActive(user) ? 'PRO' : 'FREE';
}

export function getProExpiryDate(user: AuthUser | null | undefined): Date | null {
  if (!isProPlanActive(user)) {
    return null;
  }

  if (user?.expiredAt) {
    return parseApiDate(user.expiredAt);
  }

  const fallback = new Date();
  fallback.setMonth(fallback.getMonth() + 1);
  return fallback;
}