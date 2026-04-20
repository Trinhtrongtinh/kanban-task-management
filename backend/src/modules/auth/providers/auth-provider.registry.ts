import { Injectable } from '@nestjs/common';
import { AuthProvider } from '../../../database/entities';
import { BusinessException } from '../../../common/exceptions';
import { ErrorCode } from '../../../common/enums';
import { HttpStatus } from '@nestjs/common';
import { AuthProviderContract } from './auth-provider.interface';
import { LocalAuthProvider } from './local-auth.provider';
import { GoogleAuthProvider } from './google-auth.provider';

@Injectable()
export class AuthProviderRegistry {
  private readonly providers = new Map<AuthProvider, AuthProviderContract>();

  constructor(
    localAuthProvider: LocalAuthProvider,
    googleAuthProvider: GoogleAuthProvider,
  ) {
    this.providers.set(localAuthProvider.provider, localAuthProvider);
    this.providers.set(googleAuthProvider.provider, googleAuthProvider);
  }

  get(provider: AuthProvider): AuthProviderContract {
    const authProvider = this.providers.get(provider);

    if (!authProvider) {
      throw new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        `Unsupported auth provider: ${provider}`,
      );
    }

    return authProvider;
  }
}
