"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const guards_1 = require("./guards");
const entities_1 = require("../../database/entities");
const decorators_1 = require("../../common/decorators");
const rate_limit_1 = require("../../common/rate-limit");
const config_1 = require("../../config");
let AuthController = class AuthController {
    authService;
    app;
    auth;
    jwt;
    constructor(authService, app, auth, jwt) {
        this.authService = authService;
        this.app = app;
        this.auth = auth;
        this.jwt = jwt;
    }
    async register(registerDto, response) {
        const session = await this.authService.register(registerDto);
        this.setAuthCookies(response, session.accessToken, session.refreshToken);
        return { user: session.user };
    }
    async login(loginDto, response) {
        const session = await this.authService.login(loginDto);
        this.setAuthCookies(response, session.accessToken, session.refreshToken);
        return { user: session.user };
    }
    async refresh(request, response) {
        const refreshToken = request.cookies?.[this.getRefreshCookieName()];
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is missing');
        }
        const session = await this.authService.refreshSession(refreshToken);
        this.setAuthCookies(response, session.accessToken, session.refreshToken);
        return { user: session.user };
    }
    async logout(userId, response) {
        await this.authService.logout(userId);
        this.clearAuthCookies(response);
        return { success: true };
    }
    async googleLogin() { }
    async googleCallback(request, response) {
        await this.handleSocialCallback(entities_1.AuthProvider.GOOGLE, request.user, response);
    }
    async getProfile(userId) {
        return this.authService.getProfile(userId);
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }
    async verifyResetToken(verifyResetTokenDto) {
        return this.authService.verifyResetToken(verifyResetTokenDto);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    setAuthCookies(response, accessToken, refreshToken) {
        const secure = this.app.nodeEnv === 'production';
        const sameSite = this.auth.cookies.sameSite;
        const domain = this.auth.cookies.domain;
        response.cookie(this.getAccessCookieName(), accessToken, {
            httpOnly: true,
            secure,
            sameSite,
            domain,
            path: '/',
            maxAge: this.getCookieMaxAgeMs(this.jwt.expiresIn),
        });
        response.cookie(this.getRefreshCookieName(), refreshToken, {
            httpOnly: true,
            secure,
            sameSite,
            domain,
            path: '/auth/refresh',
            maxAge: this.getCookieMaxAgeMs(this.jwt.refreshExpiresIn),
        });
        response.cookie(this.getCsrfCookieName(), this.generateCsrfToken(), {
            httpOnly: false,
            secure,
            sameSite,
            domain,
            path: '/',
            maxAge: this.getCookieMaxAgeMs(this.jwt.refreshExpiresIn),
        });
    }
    clearAuthCookies(response) {
        const secure = this.app.nodeEnv === 'production';
        const sameSite = this.auth.cookies.sameSite;
        const domain = this.auth.cookies.domain;
        response.clearCookie(this.getAccessCookieName(), {
            httpOnly: true,
            secure,
            sameSite,
            domain,
            path: '/',
        });
        response.clearCookie(this.getRefreshCookieName(), {
            httpOnly: true,
            secure,
            sameSite,
            domain,
            path: '/auth/refresh',
        });
        response.clearCookie(this.getCsrfCookieName(), {
            httpOnly: false,
            secure,
            sameSite,
            domain,
            path: '/',
        });
    }
    getAccessCookieName() {
        return this.auth.cookies.accessTokenName;
    }
    getRefreshCookieName() {
        return this.auth.cookies.refreshTokenName;
    }
    getCsrfCookieName() {
        return this.auth.cookies.csrfTokenName;
    }
    generateCsrfToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    getCookieMaxAgeMs(duration) {
        const match = /^([0-9]+)([smhd])$/.exec(duration.trim());
        if (!match) {
            return 15 * 60 * 1000;
        }
        const value = Number(match[1]);
        const unit = match[2];
        const multiplier = {
            s: 1000,
            m: 60_000,
            h: 3_600_000,
            d: 86_400_000,
        };
        return value * (multiplier[unit] || 60_000);
    }
    async handleSocialCallback(provider, socialProfile, response) {
        if (!socialProfile) {
            response.redirect(this.getAuthFailureRedirectUrl());
            return;
        }
        const session = await this.authService.loginWithSocialProvider(provider, socialProfile);
        this.setAuthCookies(response, session.accessToken, session.refreshToken);
        response.redirect(this.getAuthSuccessRedirectUrl());
    }
    getAuthSuccessRedirectUrl() {
        return this.auth.redirects.successUrl;
    }
    getAuthFailureRedirectUrl() {
        return this.auth.redirects.failureUrl;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, rate_limit_1.RegisterRateLimit)(),
    (0, decorators_1.ResponseMessage)('User registered successfully'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, rate_limit_1.LoginRateLimit)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.ResponseMessage)('Login successful'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.ResponseMessage)('Session refreshed successfully'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.ResponseMessage)('Logout successful'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(guards_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(guards_1.GoogleAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Profile retrieved successfully'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, rate_limit_1.ForgotPasswordRateLimit)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.ResponseMessage)('If the email exists, a password reset link has been sent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('verify-reset-token'),
    (0, rate_limit_1.VerifyResetTokenRateLimit)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.ResponseMessage)('Reset token is valid'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyResetTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyResetToken", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, rate_limit_1.ResetPasswordRateLimit)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.ResponseMessage)('Password reset successful'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __param(1, (0, common_1.Inject)(config_1.appConfig.KEY)),
    __param(2, (0, common_1.Inject)(config_1.authConfig.KEY)),
    __param(3, (0, common_1.Inject)(config_1.jwtConfig.KEY)),
    __metadata("design:paramtypes", [auth_service_1.AuthService, void 0, void 0, void 0])
], AuthController);
//# sourceMappingURL=auth.controller.js.map