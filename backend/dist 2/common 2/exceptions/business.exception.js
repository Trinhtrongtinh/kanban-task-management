"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessException = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../enums");
class BusinessException extends common_1.HttpException {
    errorCode;
    constructor(errorCode, statusCode = common_1.HttpStatus.BAD_REQUEST, customMessage) {
        const message = customMessage || enums_1.ErrorMessages[errorCode];
        super(message, statusCode);
        this.errorCode = errorCode;
    }
    getErrorCode() {
        return this.errorCode;
    }
}
exports.BusinessException = BusinessException;
//# sourceMappingURL=business.exception.js.map