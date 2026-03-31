import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthProvider, User } from '../../../database/entities';
import { LoginDto, RegisterDto } from '../dto';
import { BusinessException } from '../../../common/exceptions';
import { ErrorCode } from '../../../common/enums';
import {
  AuthProviderContract,
  SocialAuthProfile,
} from './auth-provider.interface';
import { AuthUserProvisioningService } from './auth-user-provisioning.service';

@Injectable()
export class GoogleAuthProvider implements AuthProviderContract {
  readonly provider = AuthProvider.GOOGLE;

  constructor(
    private readonly authUserProvisioningService: AuthUserProvisioningService,
  ) {}

  async register(_registerDto: RegisterDto): Promise<User> {
    throw new BusinessException(
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.NOT_IMPLEMENTED,
      'Google auth provider is not configured yet',
    );
  }

  async login(_loginDto: LoginDto): Promise<User> {
    throw new BusinessException(
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.NOT_IMPLEMENTED,
      'Google auth provider is not configured yet',
    );
  }

  async authenticateSocial(socialProfile: SocialAuthProfile): Promise<User> {
    return this.authUserProvisioningService.findOrCreateUser(
      this.provider,
      socialProfile,
    );
  }
}
