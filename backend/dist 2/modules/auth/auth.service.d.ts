import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { AuthProvider, User } from '../../database/entities';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyResetTokenDto, ResetPasswordDto } from './dto';
import { MailerService } from '../notifications/mailer.service';
import { AuthProviderRegistry, SocialAuthProfile } from './providers';
import { appConfig, jwtConfig } from '../../config';
interface SessionTokens {
    accessToken: string;
    refreshToken: string;
}
interface AuthSessionResult extends SessionTokens {
    user: Partial<User>;
}
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly jwt;
    private readonly app;
    private readonly mailerService;
    private readonly authProviderRegistry;
    constructor(userRepository: Repository<User>, jwtService: JwtService, jwt: ConfigType<typeof jwtConfig>, app: ConfigType<typeof appConfig>, mailerService: MailerService, authProviderRegistry: AuthProviderRegistry);
    register(registerDto: RegisterDto): Promise<AuthSessionResult>;
    login(loginDto: LoginDto): Promise<AuthSessionResult>;
    loginWithSocialProvider(provider: AuthProvider.GOOGLE, socialProfile: SocialAuthProfile): Promise<AuthSessionResult>;
    refreshSession(refreshToken: string): Promise<AuthSessionResult>;
    logout(userId: string): Promise<void>;
    validateUser(userId: string): Promise<User | null>;
    getProfile(userId: string): Promise<Partial<User> | null>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        success: boolean;
    }>;
    verifyResetToken(verifyResetTokenDto: VerifyResetTokenDto): Promise<{
        valid: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        success: boolean;
    }>;
    private generateAccessToken;
    private generateRefreshToken;
    private issueSessionForUser;
    private syncExpiredPlanState;
    private verifyRefreshToken;
    private hashToken;
    private parseDurationToMs;
    private sanitizeUser;
    private hashResetToken;
    private getUserByValidResetTokenHash;
    private buildResetPasswordLink;
    private buildResetPasswordEmailHtml;
    private buildResetPasswordEmailText;
}
export {};
