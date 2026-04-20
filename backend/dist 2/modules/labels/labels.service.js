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
exports.LabelsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const cache_1 = require("../../common/cache");
let LabelsService = class LabelsService {
    labelRepository;
    boardRepository;
    cardRepository;
    cacheService;
    constructor(labelRepository, boardRepository, cardRepository, cacheService) {
        this.labelRepository = labelRepository;
        this.boardRepository = boardRepository;
        this.cardRepository = cardRepository;
        this.cacheService = cacheService;
    }
    async invalidateBoardLabels(boardId) {
        await this.cacheService.del(cache_1.CacheKeys.labelsByBoard(boardId));
    }
    async validateBoardExists(boardId) {
        const board = await this.boardRepository.findOne({
            where: { id: boardId },
        });
        if (!board) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getCardWithLabels(cardId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
            relations: ['labels'],
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return card;
    }
    async create(createLabelDto) {
        const { boardId, ...rest } = createLabelDto;
        await this.validateBoardExists(boardId);
        const label = this.labelRepository.create({
            boardId,
            ...rest,
        });
        const savedLabel = await this.labelRepository.save(label);
        await this.invalidateBoardLabels(boardId);
        return savedLabel;
    }
    async findAllByBoard(boardId) {
        const cacheKey = cache_1.CacheKeys.labelsByBoard(boardId);
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        await this.validateBoardExists(boardId);
        const labels = await this.labelRepository.find({
            where: { boardId },
        });
        await this.cacheService.set(cacheKey, labels, cache_1.CACHE_TTL.LABELS_BY_BOARD_SECONDS);
        return labels;
    }
    async findOne(id) {
        const label = await this.labelRepository.findOne({
            where: { id },
            relations: ['board'],
        });
        if (!label) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LABEL_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return label;
    }
    async update(id, updateLabelDto) {
        const label = await this.findOne(id);
        Object.assign(label, updateLabelDto);
        const updated = await this.labelRepository.save(label);
        await this.invalidateBoardLabels(label.boardId);
        return updated;
    }
    async remove(id) {
        const label = await this.findOne(id);
        await this.labelRepository.remove(label);
        await this.invalidateBoardLabels(label.boardId);
    }
    async addLabelToCard(cardId, labelId) {
        const card = await this.getCardWithLabels(cardId);
        const label = await this.findOne(labelId);
        const isAlreadyAssigned = card.labels.some((l) => l.id === labelId);
        if (isAlreadyAssigned) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LABEL_ALREADY_ASSIGNED, common_1.HttpStatus.CONFLICT);
        }
        card.labels.push(label);
        return this.cardRepository.save(card);
    }
    async removeLabelFromCard(cardId, labelId) {
        const card = await this.getCardWithLabels(cardId);
        const labelIndex = card.labels.findIndex((l) => l.id === labelId);
        if (labelIndex === -1) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LABEL_NOT_ASSIGNED, common_1.HttpStatus.BAD_REQUEST);
        }
        card.labels.splice(labelIndex, 1);
        return this.cardRepository.save(card);
    }
};
exports.LabelsService = LabelsService;
exports.LabelsService = LabelsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Label)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Board)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_1.AppCacheService])
], LabelsService);
//# sourceMappingURL=labels.service.js.map