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
exports.User = exports.AuthProvider = exports.PlanType = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
var PlanType;
(function (PlanType) {
    PlanType["FREE"] = "FREE";
    PlanType["PRO"] = "PRO";
})(PlanType || (exports.PlanType = PlanType = {}));
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["LOCAL"] = "LOCAL";
    AuthProvider["GOOGLE"] = "GOOGLE";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
let User = class User {
    id;
    email;
    password;
    username;
    authProvider;
    avatarUrl;
    planType;
    expiredAt;
    stripeCustomerId;
    isVerified;
    notifyDueDateEmail;
    notifyMentionEmail;
    resetPasswordTokenHash;
    resetPasswordExpiresAt;
    refreshTokenHash;
    refreshTokenExpiresAt;
    createdAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AuthProvider,
        default: AuthProvider.LOCAL,
        name: 'auth_provider',
    }),
    __metadata("design:type", String)
], User.prototype, "authProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'avatar_url' }),
    __metadata("design:type", Object)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PlanType,
        default: PlanType.FREE,
        name: 'plan_type',
    }),
    __metadata("design:type", String)
], User.prototype, "planType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'expired_at' }),
    __metadata("design:type", Object)
], User.prototype, "expiredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        name: 'stripe_customer_id',
    }),
    __metadata("design:type", Object)
], User.prototype, "stripeCustomerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_verified' }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'notify_due_date_email' }),
    __metadata("design:type", Boolean)
], User.prototype, "notifyDueDateEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'notify_mention_email' }),
    __metadata("design:type", Boolean)
], User.prototype, "notifyMentionEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        name: 'reset_password_token_hash',
    }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "resetPasswordTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'reset_password_expires_at' }),
    __metadata("design:type", Object)
], User.prototype, "resetPasswordExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        name: 'refresh_token_hash',
    }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Object)
], User.prototype, "refreshTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'refresh_token_expires_at' }),
    __metadata("design:type", Object)
], User.prototype, "refreshTokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map