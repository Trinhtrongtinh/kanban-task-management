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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const path_1 = require("path");
const promises_1 = require("fs/promises");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
let UsersService = class UsersService {
    userRepository;
    dataSource;
    constructor(userRepository, dataSource) {
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async create(username, email) {
        const user = this.userRepository.create({ username, email });
        return this.userRepository.save(user);
    }
    async findAll() {
        return this.userRepository.find();
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.findUserOrThrow(userId);
        user.username = updateProfileDto.username.trim();
        const savedUser = await this.userRepository.save(user);
        return this.sanitizeUser(savedUser);
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.findUserOrThrow(userId);
        const isValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isValid) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_CREDENTIALS, common_1.HttpStatus.UNAUTHORIZED, 'Mật khẩu hiện tại không chính xác');
        }
        user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.userRepository.save(user);
    }
    async updateNotificationPreferences(userId, updateNotificationPreferencesDto) {
        const user = await this.findUserOrThrow(userId);
        user.notifyDueDateEmail = updateNotificationPreferencesDto.notifyDueDateEmail;
        user.notifyMentionEmail = updateNotificationPreferencesDto.notifyMentionEmail;
        const savedUser = await this.userRepository.save(user);
        return this.sanitizeUser(savedUser);
    }
    async updateAvatar(userId, file) {
        if (!file) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.ATTACHMENT_UPLOAD_FAILED, common_1.HttpStatus.BAD_REQUEST, 'Vui lòng chọn ảnh đại diện hợp lệ');
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
    async deleteAccount(userId) {
        const user = await this.findUserOrThrow(userId);
        const avatarUrl = user.avatarUrl;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query('DELETE FROM card_members WHERE user_id = ?', [userId]);
            await queryRunner.query('DELETE FROM board_members WHERE user_id = ?', [userId]);
            await queryRunner.query('DELETE FROM workspace_members WHERE user_id = ?', [userId]);
            await queryRunner.query('DELETE FROM comments WHERE user_id = ?', [userId]);
            await queryRunner.query('DELETE FROM activity_logs WHERE user_id = ?', [userId]);
            await queryRunner.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
            await queryRunner.query(`DELETE cl
         FROM card_labels cl
         INNER JOIN labels l ON l.id = cl.label_id
         INNER JOIN boards b ON b.id = l.board_id
         INNER JOIN workspaces w ON w.id = b.workspace_id
         WHERE w.owner_id = ?`, [userId]);
            await queryRunner.query('UPDATE cards SET assignee_id = NULL WHERE assignee_id = ?', [
                userId,
            ]);
            await queryRunner.query('DELETE FROM workspaces WHERE owner_id = ?', [userId]);
            await queryRunner.query('DELETE FROM users WHERE id = ?', [userId]);
            await queryRunner.commitTransaction();
        }
        catch {
            await queryRunner.rollbackTransaction();
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INTERNAL_ERROR, common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'Không thể xóa tài khoản. Vui lòng thử lại');
        }
        finally {
            await queryRunner.release();
        }
        if (avatarUrl) {
            await this.removeLocalAvatar(avatarUrl);
        }
    }
    async findUserOrThrow(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.USER_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return user;
    }
    sanitizeUser(user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }
    async removeLocalAvatar(avatarUrl) {
        if (!avatarUrl.startsWith('/uploads/avatars/')) {
            return;
        }
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'avatars', (0, path_1.basename)(avatarUrl));
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch {
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], UsersService);
//# sourceMappingURL=users.service.js.map