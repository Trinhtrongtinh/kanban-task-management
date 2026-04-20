"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMonthsUtc = addMonthsUtc;
exports.getDefaultProExpiry = getDefaultProExpiry;
exports.toValidDate = toValidDate;
exports.isPlanExpired = isPlanExpired;
exports.isProPlanActive = isProPlanActive;
const entities_1 = require("../../database/entities");
const PRO_PLAN_DURATION_MONTHS = 1;
function addMonthsUtc(baseDate, months) {
    const nextDate = new Date(baseDate);
    nextDate.setUTCMonth(nextDate.getUTCMonth() + months);
    return nextDate;
}
function getDefaultProExpiry(referenceDate = new Date()) {
    return addMonthsUtc(referenceDate, PRO_PLAN_DURATION_MONTHS);
}
function toValidDate(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function isPlanExpired(expiredAt, referenceDate = new Date()) {
    const expiryDate = toValidDate(expiredAt);
    if (!expiryDate) {
        return false;
    }
    return expiryDate.getTime() <= referenceDate.getTime();
}
function isProPlanActive(plan, referenceDate = new Date()) {
    if (!plan || plan.planType !== entities_1.PlanType.PRO) {
        return false;
    }
    return !isPlanExpired(plan.expiredAt, referenceDate);
}
//# sourceMappingURL=pro-plan.util.js.map