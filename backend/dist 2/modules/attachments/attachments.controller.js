"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const rxjs_1 = require("rxjs");
const attachments_service_1 = require("./attachments.service");
const decorators_1 = require("../../common/decorators");
const multer_config_1 = require("./multer.config");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const guards_1 = require("../auth/guards");
const guards_2 = require("../../common/guards");
const decorators_2 = require("../../common/decorators");
const rate_limit_1 = require("../../common/rate-limit");
let MulterExceptionInterceptor = class MulterExceptionInterceptor {
    intercept(_ctx, next) {
        return next.handle().pipe((0, rxjs_1.catchError)((err) => {
            if (err instanceof multer_1.MulterError) {
                const message = err.code === 'LIMIT_FILE_SIZE'
                    ? `File vượt quá giới hạn ${multer_config_1.MAX_FILE_SIZE / 1024 / 1024}MB`
                    : `Lỗi upload: ${err.message}`;
                return (0, rxjs_1.throwError)(() => new common_1.BadRequestException(message));
            }
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
MulterExceptionInterceptor = __decorate([
    (0, common_1.Injectable)()
], MulterExceptionInterceptor);
let AttachmentsController = class AttachmentsController {
    attachmentsService;
    constructor(attachmentsService) {
        this.attachmentsService = attachmentsService;
    }
    async upload(cardId, file, userId) {
        if (!file) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.ATTACHMENT_UPLOAD_FAILED, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.attachmentsService.create(cardId, file, userId);
    }
    async findAllByCard(cardId) {
        return this.attachmentsService.findAllByCard(cardId);
    }
    async remove(id) {
        return this.attachmentsService.remove(id);
    }
    async restore(id) {
        return this.attachmentsService.restore(id);
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)('cards/:cardId/attachments'),
    (0, rate_limit_1.UploadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_2.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('File uploaded successfully'),
    (0, common_1.UseInterceptors)(MulterExceptionInterceptor, (0, platform_express_1.FileInterceptor)('file', multer_config_1.multerOptions)),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('cards/:cardId/attachments'),
    (0, rate_limit_1.ReadRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.CardBoardGuard),
    (0, decorators_1.ResponseMessage)('Attachments retrieved successfully'),
    __param(0, (0, common_1.Param)('cardId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findAllByCard", null);
__decorate([
    (0, common_1.Delete)('attachments/:id'),
    (0, rate_limit_1.DangerousWriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.AttachmentBoardGuard),
    (0, decorators_2.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Attachment deleted successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('attachments/:id/restore'),
    (0, rate_limit_1.WriteRateLimit)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_2.AttachmentBoardGuard),
    (0, decorators_2.RequireBoardRole)(enums_1.BoardRole.ADMIN, enums_1.BoardRole.EDITOR),
    (0, decorators_1.ResponseMessage)('Attachment restored successfully'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "restore", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map