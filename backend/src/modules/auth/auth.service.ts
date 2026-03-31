import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AuthProvider, PlanType, User } from '../../database/entities';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetTokenDto,
  ResetPasswordDto,
} from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { getDefaultProExpiry, isPlanExpired } from '../../common/utils';
import { MailerService } from '../notifications/mailer.service';
import { AuthProviderRegistry, SocialAuthProfile } from './providers';

const RESET_TOKEN_EXPIRES_MINUTES = 30;

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthSessionResult extends SessionTokens {
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly authProviderRegistry: AuthProviderRegistry,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<AuthSessionResult> {
    const provider = this.authProviderRegistry.get(AuthProvider.LOCAL);
    const user = await provider.register(registerDto);

    const session = await this.issueSessionForUser(user);

    return {
      user: this.sanitizeUser(user),
      ...session,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<AuthSessionResult> {
    const provider = this.authProviderRegistry.get(AuthProvider.LOCAL);
    const user = await provider.login(loginDto);

    const session = await this.issueSessionForUser(user);

    return {
      user: this.sanitizeUser(user),
      ...session,
    };
  }

  async loginWithSocialProvider(
    provider: AuthProvider.GOOGLE,
    socialProfile: SocialAuthProfile,
  ): Promise<AuthSessionResult> {
    const authProvider = this.authProviderRegistry.get(provider);
    const user = await authProvider.authenticateSocial(socialProfile);
    const session = await this.issueSessionForUser(user);

    return {
      user: this.sanitizeUser(user),
      ...session,
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthSessionResult> {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });

    if (!user || !user.refreshTokenHash) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await this.userRepository.save(user);
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const incomingHash = this.hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.syncExpiredPlanState(user);

    const session = await this.issueSessionForUser(user);
    return {
      user: this.sanitizeUser(user),
      ...session,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { refreshTokenHash: null, refreshTokenExpiresAt: null },
    );
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    await this.syncExpiredPlanState(user);
    return user;
  }

  async getProfile(userId: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    await this.syncExpiredPlanState(user);

    return this.sanitizeUser(user);
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return { success: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    );

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await this.userRepository.save(user);

    const resetLink = this.buildResetPasswordLink(rawToken);
    const emailSent = await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: this.buildResetPasswordEmailHtml(user.username, resetLink),
      text: this.buildResetPasswordEmailText(user.username, resetLink),
    });

    if (!emailSent) {
      throw new BusinessException(
        ErrorCode.EMAIL_SEND_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { success: true };
  }

  async verifyResetToken(
    verifyResetTokenDto: VerifyResetTokenDto,
  ): Promise<{ valid: boolean }> {
    const tokenHash = this.hashResetToken(verifyResetTokenDto.token);
    const user = await this.getUserByValidResetTokenHash(tokenHash);

    if (!user) {
      throw new BusinessException(
        ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { valid: true };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    const tokenHash = this.hashResetToken(resetPasswordDto.token);
    const user = await this.getUserByValidResetTokenHash(tokenHash);

    if (!user) {
      throw new BusinessException(
        ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await this.userRepository.save(user);

    return { success: true };
  }

  private generateAccessToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(user: User): string {
    const payload = { sub: user.id, email: user.email, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') ||
        this.configService.get<string>('jwt.secret') ||
        'default_secret',
      expiresIn:
        (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
    });
  }

  private async issueSessionForUser(user: User): Promise<SessionTokens> {
    await this.syncExpiredPlanState(user);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const refreshExpiresAt = new Date(
      Date.now() + this.parseDurationToMs(
        this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      ),
    );

    user.refreshTokenHash = this.hashToken(refreshToken);
    user.refreshTokenExpiresAt = refreshExpiresAt;
    await this.userRepository.save(user);

    return { accessToken, refreshToken };
  }

  private async syncExpiredPlanState(user: User): Promise<void> {
    if (user.planType !== PlanType.PRO) {
      return;
    }

    if (!user.expiredAt) {
      user.expiredAt = getDefaultProExpiry();
      await this.userRepository.save(user);
      return;
    }

    if (!isPlanExpired(user.expiredAt)) {
      return;
    }

    user.planType = PlanType.FREE;
    user.expiredAt = null;
    await this.userRepository.save(user);
  }

  private verifyRefreshToken(refreshToken: string): { sub: string; email: string; type?: string } {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string; type?: string }>(
        refreshToken,
        {
          secret:
            this.configService.get<string>('jwt.refreshSecret') ||
            this.configService.get<string>('jwt.secret') ||
            'default_secret',
        },
      );

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationToMs(duration: string): number {
    const match = /^([0-9]+)([smhd])$/.exec(duration.trim());
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2];

    const multiplier: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * (multiplier[unit] || 86_400_000);
  }

  private sanitizeUser(user: User): Partial<User> {
    const {
      password,
      resetPasswordTokenHash,
      resetPasswordExpiresAt,
      refreshTokenHash,
      refreshTokenExpiresAt,
      ...result
    } = user;
    return result;
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async getUserByValidResetTokenHash(tokenHash: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordTokenHash: tokenHash },
    });

    if (!user) {
      return null;
    }

    if (
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() < Date.now()
    ) {
      throw new BusinessException(
        ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED,
        HttpStatus.BAD_REQUEST,
      );
    }

    return user;
  }

  private buildResetPasswordLink(token: string): string {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${frontendUrl}/reset-password?token=${token}`;
  }

  private buildResetPasswordEmailHtml(username: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <div style="max-width: 560px; margin: 0 auto; padding: 20px;">
          <h2 style="margin-bottom: 8px;">Password reset request</h2>
          <p>Hello ${username || 'there'},</p>
          <p>We received a request to reset your password. Click the button below to continue:</p>
          <p style="margin: 24px 0;">
            <a
              href="${resetLink}"
              style="display: inline-block; background: #0f172a; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px;"
            >
              Reset password
            </a>
          </p>
          <p>This link expires in ${RESET_TOKEN_EXPIRES_MINUTES} minutes and can be used only once.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  private buildResetPasswordEmailText(username: string, resetLink: string): string {
    return [
      `Hello ${username || 'there'},`,
      'We received a request to reset your password.',
      `Reset password: ${resetLink}`,
      `This link expires in ${RESET_TOKEN_EXPIRES_MINUTES} minutes and can be used once.`,
      'If you did not request this, please ignore this email.',
    ].join('\n');
  }

}
