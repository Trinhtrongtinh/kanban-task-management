import { PlanType } from '../../database/entities';
type PlanLike = {
    planType?: PlanType | string | null;
    expiredAt?: Date | string | null;
};
export declare function addMonthsUtc(baseDate: Date, months: number): Date;
export declare function getDefaultProExpiry(referenceDate?: Date): Date;
export declare function toValidDate(value: Date | string | number | null | undefined): Date | null;
export declare function isPlanExpired(expiredAt: Date | string | null | undefined, referenceDate?: Date): boolean;
export declare function isProPlanActive(plan: PlanLike | null | undefined, referenceDate?: Date): boolean;
export {};
