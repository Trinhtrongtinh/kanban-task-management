import { ExecutionContext } from '@nestjs/common';
export declare function getRequestIp(req: Record<string, any>): string;
export declare function getUserOrIpTracker(req: Record<string, any>): string;
export declare function getAuthTargetTracker(req: Record<string, any>, _context: ExecutionContext): string;
export declare function getShortQueryAwareLimit(context: ExecutionContext): number;
