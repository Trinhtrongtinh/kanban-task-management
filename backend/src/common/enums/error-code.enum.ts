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
  PASSWORD_RESET_TOKEN_INVALID = 'AUTH_PASSWORD_RESET_TOKEN_INVALID',
  PASSWORD_RESET_TOKEN_EXPIRED = 'AUTH_PASSWORD_RESET_TOKEN_EXPIRED',

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
  BOARD_TITLE_EXISTS = 'BOARD_TITLE_EXISTS',
  PLAN_LIMIT_EXCEEDED = 'PLAN_LIMIT_EXCEEDED',

  // List (for future use)
  LIST_NOT_FOUND = 'LIST_NOT_FOUND',
  LIST_TITLE_EXISTS = 'LIST_TITLE_EXISTS',

  // Card (for future use)
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',

  // Label
  LABEL_NOT_FOUND = 'LABEL_NOT_FOUND',
  LABEL_ALREADY_ASSIGNED = 'LABEL_ALREADY_ASSIGNED',
  LABEL_NOT_ASSIGNED = 'LABEL_NOT_ASSIGNED',

  // Checklist
  CHECKLIST_NOT_FOUND = 'CHECKLIST_NOT_FOUND',
  CHECKLIST_ITEM_NOT_FOUND = 'CHECKLIST_ITEM_NOT_FOUND',

  // Attachment
  ATTACHMENT_NOT_FOUND = 'ATTACHMENT_NOT_FOUND',
  ATTACHMENT_UPLOAD_FAILED = 'ATTACHMENT_UPLOAD_FAILED',
  ATTACHMENT_FILE_TOO_LARGE = 'ATTACHMENT_FILE_TOO_LARGE',
  ATTACHMENT_INVALID_TYPE = 'ATTACHMENT_INVALID_TYPE',

  // Comment
  COMMENT_NOT_FOUND = 'COMMENT_NOT_FOUND',

  // Invitation
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',

  // Authorization
  FORBIDDEN = 'FORBIDDEN',

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
  [ErrorCode.UNAUTHORIZED_ACCESS]:
    'You are not authorized to access this resource',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please login again',
  [ErrorCode.TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCode.PASSWORD_RESET_TOKEN_INVALID]:
    'Invalid password reset token',
  [ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]:
    'Password reset token has expired',

  // User
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.USER_EMAIL_EXISTS]: 'Email is already registered',

  // Workspace
  [ErrorCode.WORKSPACE_NOT_FOUND]: 'Workspace not found',
  [ErrorCode.WORKSPACE_ALREADY_EXISTS]: 'Workspace already exists',
  [ErrorCode.WORKSPACE_SLUG_EXISTS]: 'Workspace slug is already taken',
  [ErrorCode.WORKSPACE_ACCESS_DENIED]:
    'You do not have access to this workspace',

  // Board
  [ErrorCode.BOARD_NOT_FOUND]: 'Board not found',
  [ErrorCode.BOARD_ACCESS_DENIED]: 'You do not have access to this board',
  [ErrorCode.BOARD_SLUG_EXISTS]: 'Board slug is already taken',
  [ErrorCode.BOARD_TITLE_EXISTS]: 'Board name already exists in this workspace',
  [ErrorCode.PLAN_LIMIT_EXCEEDED]: 'Bạn đã đạt giới hạn gói Free. Nâng cấp lên Pro để tiếp tục.',

  // List
  [ErrorCode.LIST_NOT_FOUND]: 'List not found',
  [ErrorCode.LIST_TITLE_EXISTS]: 'List name already exists in this board',

  // Card
  [ErrorCode.CARD_NOT_FOUND]: 'Card not found',

  // Label
  [ErrorCode.LABEL_NOT_FOUND]: 'Label not found',
  [ErrorCode.LABEL_ALREADY_ASSIGNED]: 'Label is already assigned to this card',
  [ErrorCode.LABEL_NOT_ASSIGNED]: 'Label is not assigned to this card',

  // Checklist
  [ErrorCode.CHECKLIST_NOT_FOUND]: 'Checklist not found',
  [ErrorCode.CHECKLIST_ITEM_NOT_FOUND]: 'Checklist item not found',

  // Attachment
  [ErrorCode.ATTACHMENT_NOT_FOUND]: 'Attachment not found',
  [ErrorCode.ATTACHMENT_UPLOAD_FAILED]: 'Failed to upload file',
  [ErrorCode.ATTACHMENT_FILE_TOO_LARGE]: 'File size exceeds the limit (5MB)',
  [ErrorCode.ATTACHMENT_INVALID_TYPE]: 'Invalid file type',

  // Comment
  [ErrorCode.COMMENT_NOT_FOUND]: 'Comment not found',

  // Invitation
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
  [ErrorCode.INVITATION_EXPIRED]: 'Invitation has expired',

  // Authorization
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',

  // General
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
};
