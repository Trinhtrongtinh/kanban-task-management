"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["INVALID_CREDENTIALS"] = "AUTH_INVALID_CREDENTIALS";
    ErrorCode["UNAUTHORIZED_ACCESS"] = "AUTH_UNAUTHORIZED_ACCESS";
    ErrorCode["TOKEN_EXPIRED"] = "AUTH_TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "AUTH_TOKEN_INVALID";
    ErrorCode["PASSWORD_RESET_TOKEN_INVALID"] = "AUTH_PASSWORD_RESET_TOKEN_INVALID";
    ErrorCode["PASSWORD_RESET_TOKEN_EXPIRED"] = "AUTH_PASSWORD_RESET_TOKEN_EXPIRED";
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["USER_ALREADY_EXISTS"] = "USER_ALREADY_EXISTS";
    ErrorCode["USER_EMAIL_EXISTS"] = "USER_EMAIL_EXISTS";
    ErrorCode["WORKSPACE_NOT_FOUND"] = "WORKSPACE_NOT_FOUND";
    ErrorCode["WORKSPACE_ALREADY_EXISTS"] = "WORKSPACE_ALREADY_EXISTS";
    ErrorCode["WORKSPACE_SLUG_EXISTS"] = "WORKSPACE_SLUG_EXISTS";
    ErrorCode["WORKSPACE_ACCESS_DENIED"] = "WORKSPACE_ACCESS_DENIED";
    ErrorCode["BOARD_NOT_FOUND"] = "BOARD_NOT_FOUND";
    ErrorCode["BOARD_ACCESS_DENIED"] = "BOARD_ACCESS_DENIED";
    ErrorCode["BOARD_SLUG_EXISTS"] = "BOARD_SLUG_EXISTS";
    ErrorCode["BOARD_TITLE_EXISTS"] = "BOARD_TITLE_EXISTS";
    ErrorCode["PLAN_LIMIT_EXCEEDED"] = "PLAN_LIMIT_EXCEEDED";
    ErrorCode["LIST_NOT_FOUND"] = "LIST_NOT_FOUND";
    ErrorCode["LIST_TITLE_EXISTS"] = "LIST_TITLE_EXISTS";
    ErrorCode["CARD_NOT_FOUND"] = "CARD_NOT_FOUND";
    ErrorCode["LABEL_NOT_FOUND"] = "LABEL_NOT_FOUND";
    ErrorCode["LABEL_ALREADY_ASSIGNED"] = "LABEL_ALREADY_ASSIGNED";
    ErrorCode["LABEL_NOT_ASSIGNED"] = "LABEL_NOT_ASSIGNED";
    ErrorCode["CHECKLIST_NOT_FOUND"] = "CHECKLIST_NOT_FOUND";
    ErrorCode["CHECKLIST_ITEM_NOT_FOUND"] = "CHECKLIST_ITEM_NOT_FOUND";
    ErrorCode["ATTACHMENT_NOT_FOUND"] = "ATTACHMENT_NOT_FOUND";
    ErrorCode["ATTACHMENT_UPLOAD_FAILED"] = "ATTACHMENT_UPLOAD_FAILED";
    ErrorCode["ATTACHMENT_FILE_TOO_LARGE"] = "ATTACHMENT_FILE_TOO_LARGE";
    ErrorCode["ATTACHMENT_INVALID_TYPE"] = "ATTACHMENT_INVALID_TYPE";
    ErrorCode["COMMENT_NOT_FOUND"] = "COMMENT_NOT_FOUND";
    ErrorCode["EMAIL_SEND_FAILED"] = "EMAIL_SEND_FAILED";
    ErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCode["INVITATION_EXPIRED"] = "INVITATION_EXPIRED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
exports.ErrorMessages = {
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCode.UNAUTHORIZED_ACCESS]: 'You are not authorized to access this resource',
    [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please login again',
    [ErrorCode.TOKEN_INVALID]: 'Invalid authentication token',
    [ErrorCode.PASSWORD_RESET_TOKEN_INVALID]: 'Invalid password reset token',
    [ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]: 'Password reset token has expired',
    [ErrorCode.USER_NOT_FOUND]: 'User not found',
    [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
    [ErrorCode.USER_EMAIL_EXISTS]: 'Email is already registered',
    [ErrorCode.WORKSPACE_NOT_FOUND]: 'Workspace not found',
    [ErrorCode.WORKSPACE_ALREADY_EXISTS]: 'Workspace already exists',
    [ErrorCode.WORKSPACE_SLUG_EXISTS]: 'Workspace slug is already taken',
    [ErrorCode.WORKSPACE_ACCESS_DENIED]: 'You do not have access to this workspace',
    [ErrorCode.BOARD_NOT_FOUND]: 'Board not found',
    [ErrorCode.BOARD_ACCESS_DENIED]: 'You do not have access to this board',
    [ErrorCode.BOARD_SLUG_EXISTS]: 'Board slug is already taken',
    [ErrorCode.BOARD_TITLE_EXISTS]: 'Board name already exists in this workspace',
    [ErrorCode.PLAN_LIMIT_EXCEEDED]: 'Bạn đã đạt giới hạn gói Free. Nâng cấp lên Pro để tiếp tục.',
    [ErrorCode.LIST_NOT_FOUND]: 'List not found',
    [ErrorCode.LIST_TITLE_EXISTS]: 'List name already exists in this board',
    [ErrorCode.CARD_NOT_FOUND]: 'Card not found',
    [ErrorCode.LABEL_NOT_FOUND]: 'Label not found',
    [ErrorCode.LABEL_ALREADY_ASSIGNED]: 'Label is already assigned to this card',
    [ErrorCode.LABEL_NOT_ASSIGNED]: 'Label is not assigned to this card',
    [ErrorCode.CHECKLIST_NOT_FOUND]: 'Checklist not found',
    [ErrorCode.CHECKLIST_ITEM_NOT_FOUND]: 'Checklist item not found',
    [ErrorCode.ATTACHMENT_NOT_FOUND]: 'Attachment not found',
    [ErrorCode.ATTACHMENT_UPLOAD_FAILED]: 'Failed to upload file',
    [ErrorCode.ATTACHMENT_FILE_TOO_LARGE]: 'File size exceeds the limit (5MB)',
    [ErrorCode.ATTACHMENT_INVALID_TYPE]: 'Invalid file type',
    [ErrorCode.COMMENT_NOT_FOUND]: 'Comment not found',
    [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email',
    [ErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
    [ErrorCode.INVITATION_EXPIRED]: 'Invitation has expired',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
    [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
    [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
};
//# sourceMappingURL=error-code.enum.js.map