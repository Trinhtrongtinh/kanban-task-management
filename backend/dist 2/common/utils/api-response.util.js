"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(data, message = 'Request successful', statusCode = 200) {
        return {
            success: true,
            statusCode,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }
    static isApiResponse(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        const response = obj;
        return (typeof response.success === 'boolean' &&
            typeof response.statusCode === 'number' &&
            typeof response.message === 'string' &&
            'data' in response &&
            typeof response.timestamp === 'string');
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.util.js.map