import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../enums';

/**
 * Custom Business Exception for application-specific errors
 * Provides error code for frontend error handling
 */
export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;

  constructor(
    errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    customMessage?: string,
  ) {
    const message = customMessage || ErrorMessages[errorCode];
    super(message, statusCode);
    this.errorCode = errorCode;
  }

  getErrorCode(): ErrorCode {
    return this.errorCode;
  }
}
