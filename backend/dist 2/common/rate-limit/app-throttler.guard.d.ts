import { ThrottlerGuard } from '@nestjs/throttler';
export declare class AppThrottlerGuard extends ThrottlerGuard {
    protected getTracker(req: Record<string, any>): Promise<string>;
    protected throwThrottlingException(context: import('@nestjs/common').ExecutionContext, throttlerLimitDetail: import('@nestjs/throttler').ThrottlerLimitDetail): Promise<void>;
}
