import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { SocialAuthProfile } from '../providers';
import { appConfig, googleConfig } from '../../../config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(appConfig.KEY)
    app: ConfigType<typeof appConfig>,
    @Inject(googleConfig.KEY)
    google: ConfigType<typeof googleConfig>,
  ) {
    super({
      clientID: google.clientId,
      clientSecret: google.clientSecret,
      callbackURL:
        google.callbackUrl || `${app.backendUrl}/auth/google/callback`,
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
      return done(
        new UnauthorizedException('Google account email is unavailable'),
        false,
      );
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
