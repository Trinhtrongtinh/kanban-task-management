import { BoardRole } from '../enums';
export declare const BOARD_ROLES_KEY = "boardRoles";
export declare const RequireBoardRole: (...roles: BoardRole[]) => import("@nestjs/common").CustomDecorator<string>;
