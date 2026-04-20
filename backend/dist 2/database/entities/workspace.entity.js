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
exports.Workspace = exports.WorkspaceType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const board_entity_1 = require("./board.entity");
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["BUSINESS"] = "Business";
    WorkspaceType["EDUCATION"] = "Education";
    WorkspaceType["PERSONAL"] = "Personal";
})(WorkspaceType || (exports.WorkspaceType = WorkspaceType = {}));
let Workspace = class Workspace {
    id;
    name;
    slug;
    description;
    type;
    ownerId;
    owner;
    boards;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Workspace = Workspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Workspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Workspace.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Workspace.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Workspace.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkspaceType,
        default: WorkspaceType.PERSONAL,
    }),
    __metadata("design:type", String)
], Workspace.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', unique: true }),
    __metadata("design:type", String)
], Workspace.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Workspace.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => board_entity_1.Board, (board) => board.workspace),
    __metadata("design:type", Array)
], Workspace.prototype, "boards", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Workspace.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Workspace.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Workspace.prototype, "deletedAt", void 0);
exports.Workspace = Workspace = __decorate([
    (0, typeorm_1.Entity)('workspaces')
], Workspace);
//# sourceMappingURL=workspace.entity.js.map