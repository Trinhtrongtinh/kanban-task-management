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
exports.GoogleAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const config_1 = require("../../../config");
let GoogleAuthGuard = class GoogleAuthGuard extends (0, passport_1.AuthGuard)('google') {
    auth;
    google;
    constructor(auth, google) {
        super();
        this.auth = auth;
        this.google = google;
    }
    getAuthenticateOptions(context) {
        this.ensureOAuthConfigured();
        const request = context.switchToHttp().getRequest();
        const isCallback = request.path?.endsWith('/callback');
        return {
            scope: ['email', 'profile'],
            session: false,
            failureRedirect: isCallback ? this.getFailureRedirectUrl() : undefined,
        };
    }
    getFailureRedirectUrl() {
        return this.auth.redirects.failureUrl;
    }
    ensureOAuthConfigured() {
        const clientId = this.google.clientId;
        const clientSecret = this.google.clientSecret;
        if (!clientId ||
            !clientSecret ||
            clientId === 'not-configured' ||
            clientSecret === 'not-configured') {
            throw new common_1.ServiceUnavailableException('Google login is not configured on server');
        }
    }
};
exports.GoogleAuthGuard = GoogleAuthGuard;
exports.GoogleAuthGuard = GoogleAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.authConfig.KEY)),
    __param(1, (0, common_1.Inject)(config_1.googleConfig.KEY)),
    __metadata("design:paramtypes", [void 0, void 0])
], GoogleAuthGuard);
//# sourceMappingURL=google-auth.guard.js.map