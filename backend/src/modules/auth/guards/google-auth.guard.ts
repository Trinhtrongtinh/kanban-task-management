import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return this.configService.get<string>(
      'AUTH_FAILURE_REDIRECT_URL',
      `${frontendUrl}/login?error=social_auth_failed`,
    );
  }

  private ensureOAuthConfigured(): void {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Google login is not configured on server',
      );
    }
  }
}
