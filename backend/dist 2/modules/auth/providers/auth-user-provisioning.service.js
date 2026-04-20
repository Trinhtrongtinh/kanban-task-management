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
exports.AuthUserProvisioningService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const entities_1 = require("../../../database/entities");
const exceptions_1 = require("../../../common/exceptions");
const enums_1 = require("../../../common/enums");
let AuthUserProvisioningService = class AuthUserProvisioningService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findOrCreateUser(provider, socialProfile) {
        const email = socialProfile.email.trim().toLowerCase();
        if (!email) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.INVALID_CREDENTIALS, common_1.HttpStatus.UNAUTHORIZED, `${provider} account did not provide a usable email`);
        }
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            let shouldSave = false;
            if (!existingUser.avatarUrl && socialProfile.avatarUrl) {
                existingUser.avatarUrl = socialProfile.avatarUrl;
                shouldSave = true;
            }
            if (!existingUser.isVerified && socialProfile.isVerified) {
                existingUser.isVerified = true;
                shouldSave = true;
            }
            if (shouldSave) {
                await this.userRepository.save(existingUser);
            }
            return existingUser;
        }
        const user = this.userRepository.create({
            email,
            username: this.buildUsername(socialProfile),
            password: await bcrypt.hash((0, crypto_1.randomBytes)(32).toString('hex'), 10),
            authProvider: provider,
            avatarUrl: socialProfile.avatarUrl ?? null,
            isVerified: socialProfile.isVerified ?? true,
        });
        await this.userRepository.save(user);
        return user;
    }
    buildUsername(socialProfile) {
        const candidate = (socialProfile.username || socialProfile.email.split('@')[0] || 'user')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 50);
        return candidate || 'user';
    }
};
exports.AuthUserProvisioningService = AuthUserProvisioningService;
exports.AuthUserProvisioningService = AuthUserProvisioningService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuthUserProvisioningService);
//# sourceMappingURL=auth-user-provisioning.service.js.map