import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  constructor(private readonly usersService: UsersService) {}

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
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser('userId') userId: string): Promise<void> {
    return this.usersService.deleteAccount(userId);
  }
}
