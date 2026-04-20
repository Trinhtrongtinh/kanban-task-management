import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  Req,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetTokenDto,
  ResetPasswordDto,
} from './dto';
import { GoogleAuthGuard, JwtAuthGuard } from './guards';
import { AuthProvider, User } from '../../database/entities';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import {
  ForgotPasswordRateLimit,
  LoginRateLimit,
  RegisterRateLimit,
  ResetPasswordRateLimit,
  VerifyResetTokenRateLimit,
} from '../../common/rate-limit';
import { SocialAuthProfile } from './providers';
import { appConfig, authConfig, jwtConfig } from '../../config';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {}

  @Post('register')
  @RegisterRateLimit()
  @ResponseMessage('User registered successfully')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: Partial<User> }> {
    const session = await this.authService.register(registerDto);
    this.setAuthCookies(response, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Post('login')
  @LoginRateLimit()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: Partial<User> }> {
    const session = await this.authService.login(loginDto);
    this.setAuthCookies(response, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Session refreshed successfully')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: Partial<User> }> {
    const refreshToken = request.cookies?.[this.getRefreshCookieName()];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const session = await this.authService.refreshSession(refreshToken);
    this.setAuthCookies(response, session.accessToken, session.refreshToken);
    return { user: session.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logout successful')
  async logout(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: boolean }> {
    await this.authService.logout(userId);
    this.clearAuthCookies(response);
    return { success: true };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.handleSocialCallback(
      AuthProvider.GOOGLE,
      request.user as SocialAuthProfile,
      response,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Profile retrieved successfully')
  async getProfile(
    @CurrentUser('userId') userId: string,
  ): Promise<Partial<User> | null> {
    return this.authService.getProfile(userId);
  }

  @Post('forgot-password')
  @ForgotPasswordRateLimit()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('If the email exists, a password reset link has been sent')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-reset-token')
  @VerifyResetTokenRateLimit()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Reset token is valid')
  async verifyResetToken(
    @Body() verifyResetTokenDto: VerifyResetTokenDto,
  ): Promise<{ valid: boolean }> {
    return this.authService.verifyResetToken(verifyResetTokenDto);
  }

  @Post('reset-password')
  @ResetPasswordRateLimit()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password reset successful')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure = this.app.nodeEnv === 'production';
    const sameSite = this.auth.cookies.sameSite;
    const domain = this.auth.cookies.domain;

    response.cookie(this.getAccessCookieName(), accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
      maxAge: this.getCookieMaxAgeMs(this.jwt.expiresIn),
    });

    response.cookie(this.getRefreshCookieName(), refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/auth/refresh',
      maxAge: this.getCookieMaxAgeMs(this.jwt.refreshExpiresIn),
    });

    response.cookie(this.getCsrfCookieName(), this.generateCsrfToken(), {
      httpOnly: false,
      secure,
      sameSite,
      domain,
      path: '/',
      maxAge: this.getCookieMaxAgeMs(this.jwt.refreshExpiresIn),
    });
  }

  private clearAuthCookies(response: Response): void {
    const secure = this.app.nodeEnv === 'production';
    const sameSite = this.auth.cookies.sameSite;
    const domain = this.auth.cookies.domain;

    response.clearCookie(this.getAccessCookieName(), {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    });
    response.clearCookie(this.getRefreshCookieName(), {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/auth/refresh',
    });
    response.clearCookie(this.getCsrfCookieName(), {
      httpOnly: false,
      secure,
      sameSite,
      domain,
      path: '/',
    });
  }

  private getAccessCookieName(): string {
    return this.auth.cookies.accessTokenName;
  }

  private getRefreshCookieName(): string {
    return this.auth.cookies.refreshTokenName;
  }

  private getCsrfCookieName(): string {
    return this.auth.cookies.csrfTokenName;
  }

  private generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }

  private getCookieMaxAgeMs(duration: string): number {
    const match = /^([0-9]+)([smhd])$/.exec(duration.trim());
    if (!match) {
      return 15 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multiplier: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * (multiplier[unit] || 60_000);
  }

  private async handleSocialCallback(
    provider: AuthProvider.GOOGLE,
    socialProfile: SocialAuthProfile | undefined,
    response: Response,
  ): Promise<void> {
    if (!socialProfile) {
      response.redirect(this.getAuthFailureRedirectUrl());
      return;
    }

    const session = await this.authService.loginWithSocialProvider(
      provider,
      socialProfile,
    );
    this.setAuthCookies(response, session.accessToken, session.refreshToken);
    response.redirect(this.getAuthSuccessRedirectUrl());
  }

  private getAuthSuccessRedirectUrl(): string {
    return this.auth.redirects.successUrl;
  }

  private getAuthFailureRedirectUrl(): string {
    return this.auth.redirects.failureUrl;
  }
}
