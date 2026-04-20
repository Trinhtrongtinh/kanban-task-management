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
exports.ChecklistItem = void 0;
const typeorm_1 = require("typeorm");
const checklist_entity_1 = require("./checklist.entity");
let ChecklistItem = class ChecklistItem {
    id;
    checklistId;
    checklist;
    content;
    isDone;
    position;
    deletedAt;
};
exports.ChecklistItem = ChecklistItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChecklistItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'checklist_id' }),
    __metadata("design:type", String)
], ChecklistItem.prototype, "checklistId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => checklist_entity_1.Checklist, (checklist) => checklist.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'checklist_id' }),
    __metadata("design:type", checklist_entity_1.Checklist)
], ChecklistItem.prototype, "checklist", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ChecklistItem.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_done' }),
    __metadata("design:type", Boolean)
], ChecklistItem.prototype, "isDone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ChecklistItem.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], ChecklistItem.prototype, "deletedAt", void 0);
exports.ChecklistItem = ChecklistItem = __decorate([
    (0, typeorm_1.Entity)('checklist_items')
], ChecklistItem);
//# sourceMappingURL=checklist-item.entity.js.map