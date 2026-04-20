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
exports.CsrfCookieGuard = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../exceptions");
const enums_1 = require("../enums");
const config_1 = require("../../config");
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER_NAME = 'x-csrf-token';
let CsrfCookieGuard = class CsrfCookieGuard {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (SAFE_METHODS.has(request.method.toUpperCase())) {
            return true;
        }
        const accessCookieName = this.auth.cookies.accessTokenName;
        const refreshCookieName = this.auth.cookies.refreshTokenName;
        const csrfCookieName = this.auth.cookies.csrfTokenName;
        const hasSessionCookie = Boolean(request.cookies?.[accessCookieName] || request.cookies?.[refreshCookieName]);
        if (!hasSessionCookie) {
            return true;
        }
        const csrfCookie = request.cookies?.[csrfCookieName];
        const csrfHeader = request.headers[CSRF_HEADER_NAME];
        if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.UNAUTHORIZED_ACCESS, common_1.HttpStatus.FORBIDDEN, 'Invalid CSRF token');
        }
        return true;
    }
};
exports.CsrfCookieGuard = CsrfCookieGuard;
exports.CsrfCookieGuard = CsrfCookieGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.authConfig.KEY)),
    __metadata("design:paramtypes", [void 0])
], CsrfCookieGuard);
//# sourceMappingURL=csrf-cookie.guard.js.map