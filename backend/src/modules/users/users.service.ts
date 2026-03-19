import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { basename, join } from 'path';
import { unlink } from 'fs/promises';
import { User } from '../../database/entities';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import {
  ChangePasswordDto,
  UpdateNotificationPreferencesDto,
  UpdateProfileDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(username: string, email: string): Promise<User> {
    const user = this.userRepository.create({ username, email });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.findUserOrThrow(userId);
    user.username = updateProfileDto.username.trim();

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findUserOrThrow(userId);
    const isValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isValid) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        'Mật khẩu hiện tại không chính xác',
      );
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.save(user);
  }

  async updateNotificationPreferences(
    userId: string,
    updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ): Promise<Partial<User>> {
    const user = await this.findUserOrThrow(userId);

    user.notifyDueDateEmail = updateNotificationPreferencesDto.notifyDueDateEmail;
    user.notifyMentionEmail = updateNotificationPreferencesDto.notifyMentionEmail;

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async updateAvatar(
    userId: string,
    file?: Express.Multer.File,
  ): Promise<Partial<User>> {
    if (!file) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_UPLOAD_FAILED,
        HttpStatus.BAD_REQUEST,
        'Vui lòng chọn ảnh đại diện hợp lệ',
      );
    }

    const user = await this.findUserOrThrow(userId);
    const oldAvatarUrl = user.avatarUrl;
    user.avatarUrl = `/uploads/avatars/${file.filename}`;

    const savedUser = await this.userRepository.save(user);

    if (oldAvatarUrl && oldAvatarUrl !== user.avatarUrl) {
      await this.removeLocalAvatar(oldAvatarUrl);
    }

    return this.sanitizeUser(savedUser);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    if (user.avatarUrl) {
      await this.removeLocalAvatar(user.avatarUrl);
    }

    await this.userRepository.remove(user);
  }

  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return user;
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private async removeLocalAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl.startsWith('/uploads/avatars/')) {
      return;
    }

    const filePath = join(process.cwd(), 'uploads', 'avatars', basename(avatarUrl));

    try {
      await unlink(filePath);
    } catch {
      // Ignore cleanup errors for already-missing files.
    }
  }
}
