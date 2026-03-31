import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { BusinessException } from '../exceptions';
import { ErrorCode } from '../enums';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER_NAME = 'x-csrf-token';

@Injectable()
export class CsrfCookieGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const accessCookieName = this.configService.get<string>(
      'AUTH_ACCESS_COOKIE_NAME',
      'access_token',
    );
    const refreshCookieName = this.configService.get<string>(
      'AUTH_REFRESH_COOKIE_NAME',
      'refresh_token',
    );
    const csrfCookieName = this.configService.get<string>(
      'AUTH_CSRF_COOKIE_NAME',
      'csrf_token',
    );

    const hasSessionCookie = Boolean(
      request.cookies?.[accessCookieName] || request.cookies?.[refreshCookieName],
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
