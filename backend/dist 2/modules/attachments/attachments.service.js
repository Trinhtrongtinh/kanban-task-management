"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AttachmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const activities_service_1 = require("../activities/activities.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let AttachmentsService = AttachmentsService_1 = class AttachmentsService {
    attachmentRepository;
    cardRepository;
    activitiesService;
    logger = new common_1.Logger(AttachmentsService_1.name);
    constructor(attachmentRepository, cardRepository, activitiesService) {
        this.attachmentRepository = attachmentRepository;
        this.cardRepository = cardRepository;
        this.activitiesService = activitiesService;
    }
    async cleanupFile(filePath) {
        try {
            await fs.promises.unlink(filePath);
        }
        catch {
        }
    }
    async validateCardExists(cardId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async create(cardId, file, userId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
            relations: ['list'],
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!file) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.ATTACHMENT_UPLOAD_FAILED, common_1.HttpStatus.BAD_REQUEST);
        }
        const storedPath = path.join(process.cwd(), 'uploads', 'attachments', file.filename);
        let savedAttachment;
        try {
            const attachment = this.attachmentRepository.create({
                cardId,
                fileName: file.originalname,
                fileUrl: `/uploads/attachments/${file.filename}`,
                fileType: file.mimetype,
                fileSize: file.size,
            });
            savedAttachment = await this.attachmentRepository.save(attachment);
        }
        catch (err) {
            await this.cleanupFile(storedPath);
            throw err;
        }
        if (userId) {
            this.activitiesService
                .createLog({
                userId,
                boardId: card.list.boardId,
                cardId,
                action: enums_1.ActivityAction.ATTACHMENT_ADDED,
                entityTitle: file.originalname,
                details: {
                    cardTitle: card.title,
                    fileType: file.mimetype,
                    fileSize: file.size,
                },
                content: `Đã đính kèm file "${file.originalname}" vào thẻ "${card.title}"`,
            })
                .catch((err) => this.logger.error('Failed to log attachment activity', err));
        }
        return savedAttachment;
    }
    async findAllByCard(cardId) {
        await this.validateCardExists(cardId);
        return this.attachmentRepository.find({
            where: { cardId },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const attachment = await this.attachmentRepository.findOne({
            where: { id },
        });
        if (!attachment) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.ATTACHMENT_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return attachment;
    }
    async restore(id) {
        const attachment = await this.attachmentRepository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!attachment) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.ATTACHMENT_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!attachment.deletedAt) {
            return attachment;
        }
        await this.attachmentRepository.restore(id);
        const restored = await this.attachmentRepository.findOne({ where: { id } });
        if (!restored) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.ATTACHMENT_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return restored;
    }
    async remove(id) {
        const attachment = await this.findOne(id);
        await this.attachmentRepository.softDelete(attachment.id);
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = AttachmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Attachment)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        activities_service_1.ActivitiesService])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map