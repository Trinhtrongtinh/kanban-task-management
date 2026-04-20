"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => {
    const port = parseInt(process.env.PORT || '3001', 10);
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        port,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        backendUrl: process.env.BACKEND_URL || `http://localhost:${port}`,
    };
});
//# sourceMappingURL=app.config.js.map