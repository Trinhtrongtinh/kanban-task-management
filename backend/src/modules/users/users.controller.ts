import {
  Body,
  Controller,
  Delete,
  Inject,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
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
import { appConfig, authConfig } from '../../config';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
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
    const secure = this.app.nodeEnv === 'production';
    const sameSite = this.auth.cookies.sameSite;
    const domain = this.auth.cookies.domain;

    response.clearCookie(this.auth.cookies.accessTokenName, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    });
    response.clearCookie(this.auth.cookies.refreshTokenName, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/auth/refresh',
    });
    response.clearCookie(this.auth.cookies.csrfTokenName, {
      httpOnly: false,
      secure,
      sameSite,
      domain,
      path: '/',
    });
  }
}
