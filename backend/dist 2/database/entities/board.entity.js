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
exports.Board = exports.BoardVisibility = void 0;
const typeorm_1 = require("typeorm");
const workspace_entity_1 = require("./workspace.entity");
const list_entity_1 = require("./list.entity");
const label_entity_1 = require("./label.entity");
var BoardVisibility;
(function (BoardVisibility) {
    BoardVisibility["PRIVATE"] = "Private";
    BoardVisibility["WORKSPACE"] = "Workspace";
    BoardVisibility["PUBLIC"] = "Public";
})(BoardVisibility || (exports.BoardVisibility = BoardVisibility = {}));
let Board = class Board {
    id;
    workspaceId;
    workspace;
    title;
    backgroundUrl;
    visibility;
    slug;
    lists;
    labels;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Board = Board;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Board.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], Board.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, (workspace) => workspace.boards, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", workspace_entity_1.Workspace)
], Board.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Board.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'background_url' }),
    __metadata("design:type", Object)
], Board.prototype, "backgroundUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BoardVisibility,
        default: BoardVisibility.PRIVATE,
    }),
    __metadata("design:type", String)
], Board.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Board.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => list_entity_1.List, (list) => list.board),
    __metadata("design:type", Array)
], Board.prototype, "lists", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => label_entity_1.Label, (label) => label.board),
    __metadata("design:type", Array)
], Board.prototype, "labels", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Board.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Board.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Board.prototype, "deletedAt", void 0);
exports.Board = Board = __decorate([
    (0, typeorm_1.Entity)('boards')
], Board);
//# sourceMappingURL=board.entity.js.map