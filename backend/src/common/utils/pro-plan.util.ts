import { PlanType } from '../../database/entities';

const PRO_PLAN_DURATION_MONTHS = 1;

type PlanLike = {
  planType?: PlanType | string | null;
  expiredAt?: Date | string | null;
};

export function addMonthsUtc(baseDate: Date, months: number): Date {
  const nextDate = new Date(baseDate);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + months);
  return nextDate;
}

export function getDefaultProExpiry(referenceDate: Date = new Date()): Date {
  return addMonthsUtc(referenceDate, PRO_PLAN_DURATION_MONTHS);
}

export function toValidDate(
  value: Date | string | number | null | undefined,
): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isPlanExpired(
  expiredAt: Date | string | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  const expiryDate = toValidDate(expiredAt);
  if (!expiryDate) {
    return false;
  }

  return expiryDate.getTime() <= referenceDate.getTime();
}

export function isProPlanActive(
  plan: PlanLike | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!plan || plan.planType !== PlanType.PRO) {
    return false;
  }

  return !isPlanExpired(plan.expiredAt, referenceDate);
}
