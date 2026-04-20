"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const utils_1 = require("../../common/utils");
const mailer_service_1 = require("../notifications/mailer.service");
const providers_1 = require("./providers");
const config_1 = require("../../config");
const RESET_TOKEN_EXPIRES_MINUTES = 30;
let AuthService = class AuthService {
    userRepository;
    jwtService;
    jwt;
    app;
    mailerService;
    authProviderRegistry;
    constructor(userRepository, jwtService, jwt, app, mailerService, authProviderRegistry) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.jwt = jwt;
        this.app = app;
        this.mailerService = mailerService;
        this.authProviderRegistry = authProviderRegistry;
    }
    async register(registerDto) {
        const provider = this.authProviderRegistry.get(entities_1.AuthProvider.LOCAL);
        const user = await provider.register(registerDto);
        const session = await this.issueSessionForUser(user);
        return {
            user: this.sanitizeUser(user),
            ...session,
        };
    }
    async login(loginDto) {
        const provider = this.authProviderRegistry.get(entities_1.AuthProvider.LOCAL);
        const user = await provider.login(loginDto);
        const session = await this.issueSessionForUser(user);
        return {
            user: this.sanitizeUser(user),
            ...session,
        };
    }
    async loginWithSocialProvider(provider, socialProfile) {
        const authProvider = this.authProviderRegistry.get(provider);
        const user = await authProvider.authenticateSocial(socialProfile);
        const session = await this.issueSessionForUser(user);
        return {
            user: this.sanitizeUser(user),
            ...session,
        };
    }
    async refreshSession(refreshToken) {
        const payload = this.verifyRefreshToken(refreshToken);
        const user = await this.userRepository.findOne({ where: { id: payload.sub } });
        if (!user || !user.refreshTokenHash) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_CREDENTIALS, common_1.HttpStatus.UNAUTHORIZED);
        }
        if (!user.refreshTokenExpiresAt ||
            user.refreshTokenExpiresAt.getTime() < Date.now()) {
            user.refreshTokenHash = null;
            user.refreshTokenExpiresAt = null;
            await this.userRepository.save(user);
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_CREDENTIALS, common_1.HttpStatus.UNAUTHORIZED);
        }
        const incomingHash = this.hashToken(refreshToken);
        if (incomingHash !== user.refreshTokenHash) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_CREDENTIALS, common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.syncExpiredPlanState(user);
        const session = await this.issueSessionForUser(user);
        return {
            user: this.sanitizeUser(user),
            ...session,
        };
    }
    async logout(userId) {
        await this.userRepository.update({ id: userId }, { refreshTokenHash: null, refreshTokenExpiresAt: null });
    }
    async validateUser(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return null;
        }
        await this.syncExpiredPlanState(user);
        return user;
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return null;
        await this.syncExpiredPlanState(user);
        return this.sanitizeUser(user);
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.userRepository.findOne({
            where: { email: forgotPasswordDto.email },
        });
        if (!user) {
            return { success: true };
        }
        const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
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
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.EMAIL_SEND_FAILED, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return { success: true };
    }
    async verifyResetToken(verifyResetTokenDto) {
        const tokenHash = this.hashResetToken(verifyResetTokenDto.token);
        const user = await this.getUserByValidResetTokenHash(tokenHash);
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.PASSWORD_RESET_TOKEN_INVALID, common_1.HttpStatus.BAD_REQUEST);
        }
        return { valid: true };
    }
    async resetPassword(resetPasswordDto) {
        const tokenHash = this.hashResetToken(resetPasswordDto.token);
        const user = await this.getUserByValidResetTokenHash(tokenHash);
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.PASSWORD_RESET_TOKEN_INVALID, common_1.HttpStatus.BAD_REQUEST);
        }
        user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpiresAt = null;
        await this.userRepository.save(user);
        return { success: true };
    }
    generateAccessToken(user) {
        const payload = { sub: user.id, email: user.email };
        return this.jwtService.sign(payload);
    }
    generateRefreshToken(user) {
        const payload = { sub: user.id, email: user.email, type: 'refresh' };
        return this.jwtService.sign(payload, {
            secret: this.jwt.refreshSecret,
            expiresIn: this.jwt.refreshExpiresIn,
        });
    }
    async issueSessionForUser(user) {
        await this.syncExpiredPlanState(user);
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const refreshExpiresAt = new Date(Date.now() + this.parseDurationToMs(this.jwt.refreshExpiresIn));
        user.refreshTokenHash = this.hashToken(refreshToken);
        user.refreshTokenExpiresAt = refreshExpiresAt;
        await this.userRepository.save(user);
        return { accessToken, refreshToken };
    }
    async syncExpiredPlanState(user) {
        if (user.planType !== entities_1.PlanType.PRO) {
            return;
        }
        if (!user.expiredAt) {
            user.expiredAt = (0, utils_1.getDefaultProExpiry)();
            await this.userRepository.save(user);
            return;
        }
        if (!(0, utils_1.isPlanExpired)(user.expiredAt)) {
            return;
        }
        user.planType = entities_1.PlanType.FREE;
        user.expiredAt = null;
        await this.userRepository.save(user);
    }
    verifyRefreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.jwt.refreshSecret,
            });
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_CREDENTIALS, common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    parseDurationToMs(duration) {
        const match = /^([0-9]+)([smhd])$/.exec(duration.trim());
        if (!match) {
            return 7 * 24 * 60 * 60 * 1000;
        }
        const value = Number(match[1]);
        const unit = match[2];
        const multiplier = {
            s: 1000,
            m: 60_000,
            h: 3_600_000,
            d: 86_400_000,
        };
        return value * (multiplier[unit] || 86_400_000);
    }
    sanitizeUser(user) {
        const { password, resetPasswordTokenHash, resetPasswordExpiresAt, refreshTokenHash, refreshTokenExpiresAt, ...result } = user;
        return result;
    }
    hashResetToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async getUserByValidResetTokenHash(tokenHash) {
        const user = await this.userRepository.findOne({
            where: { resetPasswordTokenHash: tokenHash },
        });
        if (!user) {
            return null;
        }
        if (!user.resetPasswordExpiresAt ||
            user.resetPasswordExpiresAt.getTime() < Date.now()) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED, common_1.HttpStatus.BAD_REQUEST);
        }
        return user;
    }
    buildResetPasswordLink(token) {
        return `${this.app.frontendUrl}/reset-password?token=${token}`;
    }
    buildResetPasswordEmailHtml(username, resetLink) {
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
    buildResetPasswordEmailText(username, resetLink) {
        return [
            `Hello ${username || 'there'},`,
            'We received a request to reset your password.',
            `Reset password: ${resetLink}`,
            `This link expires in ${RESET_TOKEN_EXPIRES_MINUTES} minutes and can be used once.`,
            'If you did not request this, please ignore this email.',
        ].join('\n');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(2, (0, common_1.Inject)(config_1.jwtConfig.KEY)),
    __param(3, (0, common_1.Inject)(config_1.appConfig.KEY)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService, void 0, void 0, mailer_service_1.MailerService,
        providers_1.AuthProviderRegistry])
], AuthService);
//# sourceMappingURL=auth.service.js.map