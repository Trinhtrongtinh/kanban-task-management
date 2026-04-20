"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireWorkspaceRole = exports.WORKSPACE_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.WORKSPACE_ROLES_KEY = 'workspaceRoles';
const RequireWorkspaceRole = (...roles) => (0, common_1.SetMetadata)(exports.WORKSPACE_ROLES_KEY, roles);
exports.RequireWorkspaceRole = RequireWorkspaceRole;
//# sourceMappingURL=require-workspace-role.decorator.js.map