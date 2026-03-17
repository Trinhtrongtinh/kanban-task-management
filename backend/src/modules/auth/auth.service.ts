import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User, Workspace, WorkspaceType } from '../../database/entities';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyResetTokenDto,
  ResetPasswordDto,
} from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, WorkspaceRole, MemberStatus } from '../../common/enums';
import { MailerService } from '../notifications/mailer.service';

const RESET_TOKEN_EXPIRES_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
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
    });

    await this.userRepository.save(user);

    const accessToken = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
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

    const accessToken = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getProfile(userId: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
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

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...result } = user;
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

  /**
   * Generate slug from name for workspace
   */
  private generateSlug(name: string): string {
    const vietnameseMap: Record<string, string> = {
      à: 'a',
      á: 'a',
      ả: 'a',
      ã: 'a',
      ạ: 'a',
      ă: 'a',
      ằ: 'a',
      ắ: 'a',
      ẳ: 'a',
      ẵ: 'a',
      ặ: 'a',
      â: 'a',
      ầ: 'a',
      ấ: 'a',
      ẩ: 'a',
      ẫ: 'a',
      ậ: 'a',
      đ: 'd',
      è: 'e',
      é: 'e',
      ẻ: 'e',
      ẽ: 'e',
      ẹ: 'e',
      ê: 'e',
      ề: 'e',
      ế: 'e',
      ể: 'e',
      ễ: 'e',
      ệ: 'e',
      ì: 'i',
      í: 'i',
      ỉ: 'i',
      ĩ: 'i',
      ị: 'i',
      ò: 'o',
      ó: 'o',
      ỏ: 'o',
      õ: 'o',
      ọ: 'o',
      ô: 'o',
      ồ: 'o',
      ố: 'o',
      ổ: 'o',
      ỗ: 'o',
      ộ: 'o',
      ơ: 'o',
      ờ: 'o',
      ớ: 'o',
      ở: 'o',
      ỡ: 'o',
      ợ: 'o',
      ù: 'u',
      ú: 'u',
      ủ: 'u',
      ũ: 'u',
      ụ: 'u',
      ư: 'u',
      ừ: 'u',
      ứ: 'u',
      ử: 'u',
      ữ: 'u',
      ự: 'u',
      ỳ: 'y',
      ý: 'y',
      ỷ: 'y',
      ỹ: 'y',
      ỵ: 'y',
    };

    return name
      .toLowerCase()
      .split('')
      .map((char) => vietnameseMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
