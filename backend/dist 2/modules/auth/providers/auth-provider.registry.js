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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../../common/exceptions");
const enums_1 = require("../../../common/enums");
const common_2 = require("@nestjs/common");
const local_auth_provider_1 = require("./local-auth.provider");
const google_auth_provider_1 = require("./google-auth.provider");
let AuthProviderRegistry = class AuthProviderRegistry {
    providers = new Map();
    constructor(localAuthProvider, googleAuthProvider) {
        this.providers.set(localAuthProvider.provider, localAuthProvider);
        this.providers.set(googleAuthProvider.provider, googleAuthProvider);
    }
    get(provider) {
        const authProvider = this.providers.get(provider);
        if (!authProvider) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.VALIDATION_ERROR, common_2.HttpStatus.BAD_REQUEST, `Unsupported auth provider: ${provider}`);
        }
        return authProvider;
    }
};
exports.AuthProviderRegistry = AuthProviderRegistry;
exports.AuthProviderRegistry = AuthProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [local_auth_provider_1.LocalAuthProvider,
        google_auth_provider_1.GoogleAuthProvider])
], AuthProviderRegistry);
//# sourceMappingURL=auth-provider.registry.js.map