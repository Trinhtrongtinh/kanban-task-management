import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthProvider, User } from '../../../database/entities';
import { BusinessException } from '../../../common/exceptions';
import { ErrorCode } from '../../../common/enums';
import { SocialAuthProfile } from './auth-provider.interface';

@Injectable()
export class AuthUserProvisioningService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateUser(
    provider: AuthProvider,
    socialProfile: SocialAuthProfile,
  ): Promise<User> {
    const email = socialProfile.email.trim().toLowerCase();

    if (!email) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        `${provider} account did not provide a usable email`,
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      let shouldSave = false;

      if (!existingUser.avatarUrl && socialProfile.avatarUrl) {
        existingUser.avatarUrl = socialProfile.avatarUrl;
        shouldSave = true;
      }

      if (!existingUser.isVerified && socialProfile.isVerified) {
        existingUser.isVerified = true;
        shouldSave = true;
      }

      if (shouldSave) {
        await this.userRepository.save(existingUser);
      }

      return existingUser;
    }

    const user = this.userRepository.create({
      email,
      username: this.buildUsername(socialProfile),
      password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      authProvider: provider,
      avatarUrl: socialProfile.avatarUrl ?? null,
      isVerified: socialProfile.isVerified ?? true,
    });

    await this.userRepository.save(user);
    return user;
  }

  private buildUsername(socialProfile: SocialAuthProfile): string {
    const candidate = (socialProfile.username || socialProfile.email.split('@')[0] || 'user')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 50);

    return candidate || 'user';
  }
}
