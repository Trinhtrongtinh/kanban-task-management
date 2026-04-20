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
exports.Card = void 0;
const typeorm_1 = require("typeorm");
const list_entity_1 = require("./list.entity");
const label_entity_1 = require("./label.entity");
const checklist_entity_1 = require("./checklist.entity");
const attachment_entity_1 = require("./attachment.entity");
const comment_entity_1 = require("./comment.entity");
const user_entity_1 = require("./user.entity");
let Card = class Card {
    id;
    listId;
    list;
    assigneeId;
    assignee;
    members;
    title;
    description;
    position;
    deadline;
    isReminded;
    isArchived;
    labels;
    checklists;
    attachments;
    comments;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Card = Card;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Card.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'list_id' }),
    __metadata("design:type", String)
], Card.prototype, "listId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => list_entity_1.List, (list) => list.cards, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'list_id' }),
    __metadata("design:type", list_entity_1.List)
], Card.prototype, "list", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assignee_id', nullable: true }),
    __metadata("design:type", Object)
], Card.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'assignee_id' }),
    __metadata("design:type", user_entity_1.User)
], Card.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User),
    (0, typeorm_1.JoinTable)({
        name: 'card_members',
        joinColumn: { name: 'card_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Card.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Card.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Card.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double' }),
    __metadata("design:type", Number)
], Card.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Card.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_reminded' }),
    __metadata("design:type", Boolean)
], Card.prototype, "isReminded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_archived' }),
    __metadata("design:type", Boolean)
], Card.prototype, "isArchived", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => label_entity_1.Label, (label) => label.cards),
    (0, typeorm_1.JoinTable)({
        name: 'card_labels',
        joinColumn: { name: 'card_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'label_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Card.prototype, "labels", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => checklist_entity_1.Checklist, (checklist) => checklist.card, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Card.prototype, "checklists", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attachment_entity_1.Attachment, (attachment) => attachment.card, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Card.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, (comment) => comment.card, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Card.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Card.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Card.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Card.prototype, "deletedAt", void 0);
exports.Card = Card = __decorate([
    (0, typeorm_1.Entity)('cards')
], Card);
//# sourceMappingURL=card.entity.js.map