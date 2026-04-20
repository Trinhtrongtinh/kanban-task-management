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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const typeorm_1 = require("typeorm");
const board_entity_1 = require("./board.entity");
const card_entity_1 = require("./card.entity");
let Label = class Label {
    id;
    boardId;
    board;
    name;
    colorCode;
    cards;
};
exports.Label = Label;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Label.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'board_id' }),
    __metadata("design:type", String)
], Label.prototype, "boardId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => board_entity_1.Board, (board) => board.labels, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'board_id' }),
    __metadata("design:type", board_entity_1.Board)
], Label.prototype, "board", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Label.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, name: 'color_code' }),
    __metadata("design:type", String)
], Label.prototype, "colorCode", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => card_entity_1.Card, (card) => card.labels),
    __metadata("design:type", Array)
], Label.prototype, "cards", void 0);
exports.Label = Label = __decorate([
    (0, typeorm_1.Entity)('labels')
], Label);
//# sourceMappingURL=label.entity.js.map