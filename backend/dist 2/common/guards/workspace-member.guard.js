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
exports.WorkspaceMemberGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const enums_1 = require("../enums");
const decorators_1 = require("../decorators");
let WorkspaceMemberGuard = class WorkspaceMemberGuard {
    reflector;
    workspaceMemberRepository;
    workspaceRepository;
    constructor(reflector, workspaceMemberRepository, workspaceRepository) {
        this.reflector = reflector;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.workspaceRepository = workspaceRepository;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(decorators_1.WORKSPACE_ROLES_KEY, [context.getHandler(), context.getClass()]);
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        if (!userId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const workspaceId = request.params.workspaceId || request.params.id;
        if (!workspaceId) {
            return true;
        }
        const workspace = await this.workspaceRepository.findOne({
            where: { id: workspaceId },
            withDeleted: true,
        });
        if (!workspace) {
            throw new common_1.ForbiddenException('Workspace not found');
        }
        if (workspace.ownerId === userId) {
            request.workspaceRole = enums_1.WorkspaceRole.OWNER;
            return true;
        }
        const membership = await this.workspaceMemberRepository.findOne({
            where: { workspaceId, userId, status: enums_1.MemberStatus.ACTIVE },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not an active member of this workspace');
        }
        request.workspaceMembership = membership;
        request.workspaceRole = membership.role;
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        if (!requiredRoles.includes(membership.role)) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
};
exports.WorkspaceMemberGuard = WorkspaceMemberGuard;
exports.WorkspaceMemberGuard = WorkspaceMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkspaceMember)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Workspace)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WorkspaceMemberGuard);
//# sourceMappingURL=workspace-member.guard.js.map