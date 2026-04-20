"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('auth', () => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const rawSameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
    const sameSite = rawSameSite === 'strict' || rawSameSite === 'none' ? rawSameSite : 'lax';
    return {
        cookies: {
            accessTokenName: process.env.AUTH_ACCESS_COOKIE_NAME || 'access_token',
            refreshTokenName: process.env.AUTH_REFRESH_COOKIE_NAME || 'refresh_token',
            csrfTokenName: process.env.AUTH_CSRF_COOKIE_NAME || 'csrf_token',
            sameSite,
            domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
        },
        redirects: {
            successUrl: process.env.AUTH_SUCCESS_REDIRECT_URL || `${frontendUrl}/social-callback`,
            failureUrl: process.env.AUTH_FAILURE_REDIRECT_URL ||
                `${frontendUrl}/login?error=social_auth_failed`,
        },
    };
});
//# sourceMappingURL=auth.config.js.map