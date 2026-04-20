import { DataSource, Repository } from 'typeorm';
import { User } from '../../database/entities';
import { ChangePasswordDto, UpdateNotificationPreferencesDto, UpdateProfileDto } from './dto';
export declare class UsersService {
    private readonly userRepository;
    private readonly dataSource;
    constructor(userRepository: Repository<User>, dataSource: DataSource);
    create(username: string, email: string): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Partial<User>>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
    updateNotificationPreferences(userId: string, updateNotificationPreferencesDto: UpdateNotificationPreferencesDto): Promise<Partial<User>>;
    updateAvatar(userId: string, file?: Express.Multer.File): Promise<Partial<User>>;
    deleteAccount(userId: string): Promise<void>;
    private findUserOrThrow;
    private sanitizeUser;
    private removeLocalAvatar;
}
