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
exports.ListsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const cards_gateway_1 = require("../cards/cards.gateway");
const POSITION_GAP = 65535;
let ListsService = class ListsService {
    listRepository;
    boardRepository;
    cardsGateway;
    dataSource;
    constructor(listRepository, boardRepository, cardsGateway, dataSource) {
        this.listRepository = listRepository;
        this.boardRepository = boardRepository;
        this.cardsGateway = cardsGateway;
        this.dataSource = dataSource;
    }
    async validateBoardExists(boardId) {
        const board = await this.boardRepository.findOne({
            where: { id: boardId },
        });
        if (!board) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.BOARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async calculateNewPosition(boardId) {
        const lastList = await this.listRepository.findOne({
            where: { boardId },
            order: { position: 'DESC' },
        });
        if (!lastList) {
            return POSITION_GAP;
        }
        return lastList.position + POSITION_GAP;
    }
    async create(createListDto) {
        const { title, boardId } = createListDto;
        const normalizedTitle = title.trim();
        await this.validateBoardExists(boardId);
        const existingListWithSameTitle = await this.listRepository
            .createQueryBuilder('list')
            .where('list.board_id = :boardId', { boardId })
            .andWhere('list.deleted_at IS NULL')
            .andWhere('LOWER(TRIM(list.title)) = LOWER(TRIM(:title))', {
            title: normalizedTitle,
        })
            .getOne();
        if (existingListWithSameTitle) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_TITLE_EXISTS, common_1.HttpStatus.CONFLICT, 'Tên danh sách đã tồn tại trong bảng này');
        }
        const position = await this.calculateNewPosition(boardId);
        const list = this.listRepository.create({
            title: normalizedTitle,
            boardId,
            position,
        });
        const savedList = await this.listRepository.save(list);
        this.cardsGateway.emitListCreated(savedList.boardId, savedList);
        return savedList;
    }
    async findAllByBoard(boardId) {
        await this.validateBoardExists(boardId);
        return this.listRepository.find({
            where: { boardId },
            order: { position: 'ASC' },
            relations: [
                'cards',
                'cards.labels',
                'cards.assignee',
                'cards.members',
                'cards.attachments',
            ],
        });
    }
    async findOne(id) {
        const list = await this.listRepository.findOne({
            where: { id },
            relations: ['board'],
        });
        if (!list) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return list;
    }
    async update(id, updateListDto) {
        const list = await this.findOne(id);
        if (updateListDto.title) {
            const normalizedTitle = updateListDto.title.trim();
            const existingListWithSameTitle = await this.listRepository
                .createQueryBuilder('l')
                .where('l.board_id = :boardId', { boardId: list.boardId })
                .andWhere('l.id != :id', { id: list.id })
                .andWhere('l.deleted_at IS NULL')
                .andWhere('LOWER(TRIM(l.title)) = LOWER(TRIM(:title))', {
                title: normalizedTitle,
            })
                .getOne();
            if (existingListWithSameTitle) {
                throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_TITLE_EXISTS, common_1.HttpStatus.CONFLICT, 'Tên danh sách đã tồn tại trong bảng này');
            }
            updateListDto.title = normalizedTitle;
        }
        Object.assign(list, updateListDto);
        const updatedList = await this.listRepository.save(list);
        this.cardsGateway.emitListUpdated(updatedList.boardId, updatedList);
        return updatedList;
    }
    async remove(id) {
        const list = await this.findOne(id);
        const boardId = list.boardId;
        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(entities_1.Attachment)
                .where('card_id IN (SELECT id FROM cards WHERE list_id = :listId AND deleted_at IS NULL)', {
                listId: id,
            })
                .execute();
            await manager.softDelete(entities_1.Card, { listId: id });
            await manager.softDelete(entities_1.List, { id });
        });
        this.cardsGateway.emitListDeleted(boardId, { id, boardId });
    }
    async restore(id) {
        const list = await this.listRepository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!list) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.LIST_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        if (!list.deletedAt) {
            return this.findOne(id);
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.restore(entities_1.List, { id });
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Card)
                .where('list_id = :listId', { listId: id })
                .execute();
            await manager
                .createQueryBuilder()
                .restore()
                .from(entities_1.Attachment)
                .where('card_id IN (SELECT id FROM cards WHERE list_id = :listId)', { listId: id })
                .execute();
        });
        const restored = await this.findOne(id);
        this.cardsGateway.emitListUpdated(restored.boardId, restored);
        return restored;
    }
};
exports.ListsService = ListsService;
exports.ListsService = ListsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.List)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Board)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cards_gateway_1.CardsGateway,
        typeorm_2.DataSource])
], ListsService);
//# sourceMappingURL=lists.service.js.map