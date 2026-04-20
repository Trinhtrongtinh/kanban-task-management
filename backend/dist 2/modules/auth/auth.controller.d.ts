import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyResetTokenDto, ResetPasswordDto } from './dto';
import { User } from '../../database/entities';
import { appConfig, authConfig, jwtConfig } from '../../config';
export declare class AuthController {
    private readonly authService;
    private readonly app;
    private readonly auth;
    private readonly jwt;
    constructor(authService: AuthService, app: ConfigType<typeof appConfig>, auth: ConfigType<typeof authConfig>, jwt: ConfigType<typeof jwtConfig>);
    register(registerDto: RegisterDto, response: Response): Promise<{
        user: Partial<User>;
    }>;
    login(loginDto: LoginDto, response: Response): Promise<{
        user: Partial<User>;
    }>;
    refresh(request: Request, response: Response): Promise<{
        user: Partial<User>;
    }>;
    logout(userId: string, response: Response): Promise<{
        success: boolean;
    }>;
    googleLogin(): Promise<void>;
    googleCallback(request: Request, response: Response): Promise<void>;
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
    private setAuthCookies;
    private clearAuthCookies;
    private getAccessCookieName;
    private getRefreshCookieName;
    private getCsrfCookieName;
    private generateCsrfToken;
    private getCookieMaxAgeMs;
    private handleSocialCallback;
    private getAuthSuccessRedirectUrl;
    private getAuthFailureRedirectUrl;
}
