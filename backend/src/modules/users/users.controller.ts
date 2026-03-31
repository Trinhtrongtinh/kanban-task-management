import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { User } from '../../database/entities';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { avatarMulterOptions } from './avatar-multer.config';
import {
  ChangePasswordDto,
  UpdateNotificationPreferencesDto,
  UpdateProfileDto,
} from './dto';
import {
  DangerousWriteRateLimit,
  UploadRateLimit,
  WriteRateLimit,
} from '../../common/rate-limit';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Patch('me')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Cập nhật hồ sơ thành công')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Patch('me/password')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Đổi mật khẩu thành công')
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    await this.usersService.changePassword(userId, changePasswordDto);
    return { success: true };
  }

  @Patch('me/notification-preferences')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Cập nhật tùy chọn thông báo thành công')
  async updateNotificationPreferences(
    @CurrentUser('userId') userId: string,
    @Body() updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ): Promise<Partial<User>> {
    return this.usersService.updateNotificationPreferences(
      userId,
      updateNotificationPreferencesDto,
    );
  }

  @Post('me/avatar')
  @UploadRateLimit()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  @ResponseMessage('Cập nhật ảnh đại diện thành công')
  async uploadAvatar(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<User>> {
    return this.usersService.updateAvatar(userId, file);
  }

  @Delete('me')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.usersService.deleteAccount(userId);
    this.clearAuthCookies(response);
    return { success: true };
  }

  private clearAuthCookies(response: Response): void {
    const secure = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite =
      (this.configService.get<string>('AUTH_COOKIE_SAME_SITE', 'lax').toLowerCase() as
        | 'lax'
        | 'strict'
        | 'none');
    const domain = this.configService.get<string>('AUTH_COOKIE_DOMAIN') || undefined;

    response.clearCookie(
      this.configService.get<string>('AUTH_ACCESS_COOKIE_NAME', 'access_token'),
      { httpOnly: true, secure, sameSite, domain, path: '/' },
    );
    response.clearCookie(
      this.configService.get<string>('AUTH_REFRESH_COOKIE_NAME', 'refresh_token'),
      { httpOnly: true, secure, sameSite, domain, path: '/auth/refresh' },
    );
    response.clearCookie(
      this.configService.get<string>('AUTH_CSRF_COOKIE_NAME', 'csrf_token'),
      { httpOnly: false, secure, sameSite, domain, path: '/' },
    );
  }
}
