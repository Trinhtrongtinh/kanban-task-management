"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('google', () => {
    const port = process.env.PORT || '3001';
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    return {
        clientId: process.env.GOOGLE_CLIENT_ID || 'not-configured',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/auth/google/callback`,
    };
});
//# sourceMappingURL=google.config.js.map