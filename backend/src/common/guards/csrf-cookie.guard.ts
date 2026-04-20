import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import { BusinessException } from '../exceptions';
import { ErrorCode } from '../enums';
import { authConfig } from '../../config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER_NAME = 'x-csrf-token';

@Injectable()
export class CsrfCookieGuard implements CanActivate {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const accessCookieName = this.auth.cookies.accessTokenName;
    const refreshCookieName = this.auth.cookies.refreshTokenName;
    const csrfCookieName = this.auth.cookies.csrfTokenName;

    const hasSessionCookie = Boolean(
      request.cookies?.[accessCookieName] ||
      request.cookies?.[refreshCookieName],
    );

    if (!hasSessionCookie) {
      return true;
    }

    const csrfCookie = request.cookies?.[csrfCookieName];
    const csrfHeader = request.headers[CSRF_HEADER_NAME] as string | undefined;

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new BusinessException(
        ErrorCode.UNAUTHORIZED_ACCESS,
        HttpStatus.FORBIDDEN,
        'Invalid CSRF token',
      );
    }

    return true;
  }
}
