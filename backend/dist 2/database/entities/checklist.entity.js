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
exports.Checklist = void 0;
const typeorm_1 = require("typeorm");
const card_entity_1 = require("./card.entity");
const checklist_item_entity_1 = require("./checklist-item.entity");
let Checklist = class Checklist {
    id;
    cardId;
    card;
    title;
    items;
    deletedAt;
};
exports.Checklist = Checklist;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Checklist.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'card_id' }),
    __metadata("design:type", String)
], Checklist.prototype, "cardId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => card_entity_1.Card, (card) => card.checklists, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'card_id' }),
    __metadata("design:type", card_entity_1.Card)
], Checklist.prototype, "card", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Checklist.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => checklist_item_entity_1.ChecklistItem, (item) => item.checklist, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Checklist.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Checklist.prototype, "deletedAt", void 0);
exports.Checklist = Checklist = __decorate([
    (0, typeorm_1.Entity)('checklists')
], Checklist);
//# sourceMappingURL=checklist.entity.js.map