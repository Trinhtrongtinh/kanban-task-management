import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Profile,
  Strategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { SocialAuthProfile } from '../providers';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const backendBaseUrl =
      configService.get<string>('BACKEND_URL') ||
      `http://localhost:${configService.get<string>('PORT', '3001')}`;

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        `${backendBaseUrl}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    if (!email) {
      return done(new UnauthorizedException('Google account email is unavailable'), false);
    }

    const user: SocialAuthProfile = {
      email,
      username:
        profile.displayName?.trim() ||
        profile.name?.givenName?.trim() ||
        email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value || null,
      isVerified: true,
    };

    return done(null, user);
  }
}
