import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { getUserOrIpTracker } from './rate-limit.utils';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return getUserOrIpTracker(req);
  }

  protected async throwThrottlingException(
    context: import('@nestjs/common').ExecutionContext,
    throttlerLimitDetail: import('@nestjs/throttler').ThrottlerLimitDetail,
  ): Promise<void> {
    const retryAfter = Math.ceil(throttlerLimitDetail.timeToBlockExpire / 1000);
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
      {
        cause: new ThrottlerException(),
      },
    );
  }
}