import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums';
export declare class BusinessException extends HttpException {
    readonly errorCode: ErrorCode;
    constructor(errorCode: ErrorCode, statusCode?: HttpStatus, customMessage?: string);
    getErrorCode(): ErrorCode;
}
