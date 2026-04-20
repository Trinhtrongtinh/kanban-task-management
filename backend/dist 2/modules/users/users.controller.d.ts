import type { ConfigType } from '@nestjs/config';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { User } from '../../database/entities';
import { ChangePasswordDto, UpdateNotificationPreferencesDto, UpdateProfileDto } from './dto';
import { appConfig, authConfig } from '../../config';
export declare class UsersController {
    private readonly usersService;
    private readonly app;
    private readonly auth;
    constructor(usersService: UsersService, app: ConfigType<typeof appConfig>, auth: ConfigType<typeof authConfig>);
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Partial<User>>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        success: true;
    }>;
    updateNotificationPreferences(userId: string, updateNotificationPreferencesDto: UpdateNotificationPreferencesDto): Promise<Partial<User>>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<Partial<User>>;
    deleteAccount(userId: string, response: Response): Promise<{
        success: true;
    }>;
    private clearAuthCookies;
}
