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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const users_service_1 = require("./users.service");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../auth/guards");
const avatar_multer_config_1 = require("./avatar-multer.config");
const dto_1 = require("./dto");
const rate_limit_1 = require("../../common/rate-limit");
const config_1 = require("../../config");
let UsersController = class UsersController {
    usersService;
    app;
    auth;
    constructor(usersService, app, auth) {
        this.usersService = usersService;
        this.app = app;
        this.auth = auth;
    }
    async updateProfile(userId, updateProfileDto) {
        return this.usersService.updateProfile(userId, updateProfileDto);
    }
    async changePassword(userId, changePasswordDto) {
        await this.usersService.changePassword(userId, changePasswordDto);
        return { success: true };
    }
    async updateNotificationPreferences(userId, updateNotificationPreferencesDto) {
        return this.usersService.updateNotificationPreferences(userId, updateNotificationPreferencesDto);
    }
    async uploadAvatar(userId, file) {
        return this.usersService.updateAvatar(userId, file);
    }
    async deleteAccount(userId, response) {
        await this.usersService.deleteAccount(userId);
        this.clearAuthCookies(response);
        return { success: true };
    }
    clearAuthCookies(response) {
        const secure = this.app.nodeEnv === 'production';
        const sameSite = this.auth.cookies.sameSite;
        const domain = this.auth.cookies.domain;
        response.clearCookie(this.auth.cookies.accessTokenName, { httpOnly: true, secure, sameSite, domain, path: '/' });
        response.clearCookie(this.auth.cookies.refreshTokenName, { httpOnly: true, secure, sameSite, domain, path: '/auth/refresh' });
        response.clearCookie(this.auth.cookies.csrfTokenName, { httpOnly: false, secure, sameSite, domain, path: '/' });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Patch)('me'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Cập nhật hồ sơ thành công'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)('me/password'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Đổi mật khẩu thành công'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('me/notification-preferences'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, decorators_1.ResponseMessage)('Cập nhật tùy chọn thông báo thành công'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateNotificationPreferencesDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateNotificationPreferences", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, rate_limit_1.UploadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', avatar_multer_config_1.avatarMulterOptions)),
    (0, decorators_1.ResponseMessage)('Cập nhật ảnh đại diện thành công'),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, decorators_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __param(1, (0, common_1.Inject)(config_1.appConfig.KEY)),
    __param(2, (0, common_1.Inject)(config_1.authConfig.KEY)),
    __metadata("design:paramtypes", [users_service_1.UsersService, void 0, void 0])
], UsersController);
//# sourceMappingURL=users.controller.js.map