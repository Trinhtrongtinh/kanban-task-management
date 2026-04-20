import { ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig, googleConfig } from '../../../config';
declare const GoogleAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleAuthGuard extends GoogleAuthGuard_base {
    private readonly auth;
    private readonly google;
    constructor(auth: ConfigType<typeof authConfig>, google: ConfigType<typeof googleConfig>);
    getAuthenticateOptions(context: ExecutionContext): {
        scope: string[];
        session: boolean;
        failureRedirect: string | undefined;
    };
    private getFailureRedirectUrl;
    private ensureOAuthConfigured;
}
export {};
