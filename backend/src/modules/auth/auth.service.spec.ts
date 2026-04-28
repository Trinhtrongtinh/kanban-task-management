import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { User, AuthProvider, PlanType } from '../../database/entities';
import { MailerService } from '../notifications/mailer.service';
import { AuthProviderRegistry } from './providers';
import { appConfig, jwtConfig } from '../../config';

describe('AuthService', () => {
  let service: AuthService;

  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mailerService = {
    sendMail: jest.fn(),
  };

  const localProvider = {
    register: jest.fn(),
    login: jest.fn(),
    authenticateSocial: jest.fn(),
  };

  const authProviderRegistry = {
    get: jest.fn(() => localProvider),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        {
          provide: jwtConfig.KEY,
          useValue: {
            secret: 'access-secret',
            expiresIn: '15m',
            refreshSecret: 'refresh-secret',
            refreshExpiresIn: '7d',
          },
        },
        {
          provide: appConfig.KEY,
          useValue: {
            frontendUrl: 'http://localhost:3000',
          },
        },
        { provide: MailerService, useValue: mailerService },
        { provide: AuthProviderRegistry, useValue: authProviderRegistry },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('registers a user and returns session tokens', async () => {
    const user = {
      id: 'user-1',
      email: 'tinh@example.com',
      username: 'Tinh',
      password: 'hashed-password',
      planType: PlanType.FREE,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    } as User;

    localProvider.register.mockResolvedValue(user);
    jwtService.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');
    userRepository.save.mockImplementation(async (value: User) => value);

    const result = await service.register({
      email: 'tinh@example.com',
      password: 'Password123!',
      username: 'Tinh',
    } as never);

    expect(authProviderRegistry.get).toHaveBeenCalledWith(AuthProvider.LOCAL);
    expect(localProvider.register).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).not.toHaveProperty('password');
  });

  it('refreshes a session when the refresh token is valid', async () => {
    const refreshToken = 'refresh-token';
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      email: 'tinh@example.com',
      type: 'refresh',
    });
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'tinh@example.com',
      username: 'Tinh',
      planType: PlanType.FREE,
      refreshTokenHash,
      refreshTokenExpiresAt: new Date(Date.now() + 1000),
    } as User);
    jwtService.sign
      .mockReturnValueOnce('new-access-token')
      .mockReturnValueOnce('new-refresh-token');
    userRepository.save.mockImplementation(async (value: User) => value);

    const result = await service.refreshSession(refreshToken);

    expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
      secret: 'refresh-secret',
    });
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(userRepository.save).toHaveBeenCalled();
  });
});
