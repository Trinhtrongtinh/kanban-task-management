"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const config_1 = require("../../config");
const strategies_1 = require("./strategies");
const entities_1 = require("../../database/entities");
const notifications_module_1 = require("../notifications/notifications.module");
const providers_1 = require("./providers");
const guards_1 = require("./guards");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.User]),
            notifications_module_1.NotificationsModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.jwtConfig.KEY],
                useFactory: (jwt) => ({
                    secret: jwt.secret,
                    signOptions: {
                        expiresIn: jwt.expiresIn,
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            strategies_1.JwtStrategy,
            strategies_1.LocalStrategy,
            strategies_1.GoogleStrategy,
            guards_1.GoogleAuthGuard,
            providers_1.LocalAuthProvider,
            providers_1.GoogleAuthProvider,
            providers_1.AuthUserProvisioningService,
            providers_1.AuthProviderRegistry,
        ],
        exports: [auth_service_1.AuthService, strategies_1.JwtStrategy, passport_1.PassportModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map