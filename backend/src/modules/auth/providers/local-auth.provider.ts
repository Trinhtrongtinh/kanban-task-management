import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthProvider, User } from '../../../database/entities';
import { LoginDto, RegisterDto } from '../dto';
import { BusinessException } from '../../../common/exceptions';
import { ErrorCode } from '../../../common/enums';
import {
  AuthProviderContract,
  SocialAuthProfile,
} from './auth-provider.interface';

@Injectable()
export class LocalAuthProvider implements AuthProviderContract {
  readonly provider = AuthProvider.LOCAL;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { username, email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BusinessException(
        ErrorCode.USER_EMAIL_EXISTS,
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      authProvider: AuthProvider.LOCAL,
    });

    await this.userRepository.save(user);
    return user;
  }

  async login(loginDto: LoginDto): Promise<User> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || user.authProvider !== AuthProvider.LOCAL) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }

  async authenticateSocial(_socialProfile: SocialAuthProfile): Promise<User> {
    throw new BusinessException(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      'Local auth provider does not support social authentication',
    );
  }
}
