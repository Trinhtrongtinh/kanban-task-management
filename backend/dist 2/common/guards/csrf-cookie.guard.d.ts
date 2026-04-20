import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from '../../config';
export declare class CsrfCookieGuard implements CanActivate {
    private readonly auth;
    constructor(auth: ConfigType<typeof authConfig>);
    canActivate(context: ExecutionContext): boolean;
}
