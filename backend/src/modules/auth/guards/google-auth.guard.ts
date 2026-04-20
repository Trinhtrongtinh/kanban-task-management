import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { authConfig, googleConfig } from '../../../config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    @Inject(googleConfig.KEY)
    private readonly google: ConfigType<typeof googleConfig>,
  ) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    this.ensureOAuthConfigured();

    const request = context.switchToHttp().getRequest<{ path?: string }>();
    const isCallback = request.path?.endsWith('/callback');

    return {
      scope: ['email', 'profile'],
      session: false,
      failureRedirect: isCallback ? this.getFailureRedirectUrl() : undefined,
    };
  }

  private getFailureRedirectUrl(): string {
    return this.auth.redirects.failureUrl;
  }

  private ensureOAuthConfigured(): void {
    const clientId = this.google.clientId;
    const clientSecret = this.google.clientSecret;

    if (
      !clientId ||
      !clientSecret ||
      clientId === 'not-configured' ||
      clientSecret === 'not-configured'
    ) {
      throw new ServiceUnavailableException(
        'Google login is not configured on server',
      );
    }
  }
}
