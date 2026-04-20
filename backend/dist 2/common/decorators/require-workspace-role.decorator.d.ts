import { WorkspaceRole } from '../enums';
export declare const WORKSPACE_ROLES_KEY = "workspaceRoles";
export declare const RequireWorkspaceRole: (...roles: WorkspaceRole[]) => import("@nestjs/common").CustomDecorator<string>;
