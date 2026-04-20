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
exports.BoardMember = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const board_entity_1 = require("./board.entity");
const enums_1 = require("../../common/enums");
let BoardMember = class BoardMember {
    id;
    boardId;
    board;
    userId;
    user;
    role;
    joinedAt;
};
exports.BoardMember = BoardMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BoardMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'board_id' }),
    __metadata("design:type", String)
], BoardMember.prototype, "boardId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => board_entity_1.Board, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'board_id' }),
    __metadata("design:type", board_entity_1.Board)
], BoardMember.prototype, "board", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], BoardMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], BoardMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.BoardRole,
        default: enums_1.BoardRole.VIEWER,
    }),
    __metadata("design:type", String)
], BoardMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'joined_at' }),
    __metadata("design:type", Date)
], BoardMember.prototype, "joinedAt", void 0);
exports.BoardMember = BoardMember = __decorate([
    (0, typeorm_1.Entity)('board_members'),
    (0, typeorm_1.Unique)(['boardId', 'userId'])
], BoardMember);
//# sourceMappingURL=board-member.entity.js.map