import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshSession: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    forgotPassword: jest.fn(),
    verifyResetToken: jest.fn(),
    resetPassword: jest.fn(),
  };

  const appSettings = {
    nodeEnv: 'development',
    frontendUrl: 'http://localhost:3000',
  };
  const authSettings = {
    cookies: {
      accessTokenName: 'access_token',
      refreshTokenName: 'refresh_token',
      csrfTokenName: 'csrf_token',
      sameSite: 'lax' as const,
      domain: undefined,
    },
  };
  const jwtSettings = {
    secret: 'access-secret',
    expiresIn: '15m',
    refreshSecret: 'refresh-secret',
    refreshExpiresIn: '7d',
  };

  beforeEach(() => {
    controller = new AuthController(
      authService as never,
      appSettings as never,
      authSettings as never,
      jwtSettings as never,
    );
    jest.clearAllMocks();
  });

  it('register sets auth cookies and returns the user', async () => {
    authService.register.mockResolvedValue({
      user: { id: 'user-1', email: 'tinh@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = {
      cookie: jest.fn(),
    } as Partial<Response> as Response;

    const result = await controller.register(
      {
        email: 'tinh@example.com',
        password: 'Password123!',
        username: 'Tinh',
      } as never,
      response,
    );

    expect(result).toEqual({
      user: { id: 'user-1', email: 'tinh@example.com' },
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(response.cookie).toHaveBeenCalledTimes(3);
  });

  it('logout clears auth cookies', async () => {
    const response = {
      clearCookie: jest.fn(),
    } as Partial<Response> as Response;

    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout('user-1', response);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.logout).toHaveBeenCalledWith('user-1');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(response.clearCookie).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true });
  });
});
