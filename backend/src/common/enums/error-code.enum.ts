/**
 * Centralized Error Codes for the application
 * Format: DOMAIN_ERROR_DESCRIPTION
 * 
 * Easy to extend when adding new features (Board, Card, etc.)
 */
export enum ErrorCode {
  // Authentication & Authorization
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  UNAUTHORIZED_ACCESS = 'AUTH_UNAUTHORIZED_ACCESS',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID = 'AUTH_TOKEN_INVALID',

  // User
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_EMAIL_EXISTS = 'USER_EMAIL_EXISTS',

  // Workspace
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  WORKSPACE_ALREADY_EXISTS = 'WORKSPACE_ALREADY_EXISTS',
  WORKSPACE_SLUG_EXISTS = 'WORKSPACE_SLUG_EXISTS',
  WORKSPACE_ACCESS_DENIED = 'WORKSPACE_ACCESS_DENIED',

  // Board (for future use)
  BOARD_NOT_FOUND = 'BOARD_NOT_FOUND',
  BOARD_ACCESS_DENIED = 'BOARD_ACCESS_DENIED',
  BOARD_SLUG_EXISTS = 'BOARD_SLUG_EXISTS',

  // List (for future use)
  LIST_NOT_FOUND = 'LIST_NOT_FOUND',

  // Card (for future use)
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',

  // Label
  LABEL_NOT_FOUND = 'LABEL_NOT_FOUND',
  LABEL_ALREADY_ASSIGNED = 'LABEL_ALREADY_ASSIGNED',
  LABEL_NOT_ASSIGNED = 'LABEL_NOT_ASSIGNED',

  // General
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

/**
 * Error messages corresponding to error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.UNAUTHORIZED_ACCESS]: 'You are not authorized to access this resource',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please login again',
  [ErrorCode.TOKEN_INVALID]: 'Invalid authentication token',

  // User
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.USER_EMAIL_EXISTS]: 'Email is already registered',

  // Workspace
  [ErrorCode.WORKSPACE_NOT_FOUND]: 'Workspace not found',
  [ErrorCode.WORKSPACE_ALREADY_EXISTS]: 'Workspace already exists',
  [ErrorCode.WORKSPACE_SLUG_EXISTS]: 'Workspace slug is already taken',
  [ErrorCode.WORKSPACE_ACCESS_DENIED]: 'You do not have access to this workspace',

  // Board
  [ErrorCode.BOARD_NOT_FOUND]: 'Board not found',
  [ErrorCode.BOARD_ACCESS_DENIED]: 'You do not have access to this board',
  [ErrorCode.BOARD_SLUG_EXISTS]: 'Board slug is already taken',

  // List
  [ErrorCode.LIST_NOT_FOUND]: 'List not found',

  // Card
  [ErrorCode.CARD_NOT_FOUND]: 'Card not found',

  // Label
  [ErrorCode.LABEL_NOT_FOUND]: 'Label not found',
  [ErrorCode.LABEL_ALREADY_ASSIGNED]: 'Label is already assigned to this card',
  [ErrorCode.LABEL_NOT_ASSIGNED]: 'Label is not assigned to this card',

  // General
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
};
