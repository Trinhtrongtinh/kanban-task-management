"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireBoardRole = exports.BOARD_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.BOARD_ROLES_KEY = 'boardRoles';
const RequireBoardRole = (...roles) => (0, common_1.SetMetadata)(exports.BOARD_ROLES_KEY, roles);
exports.RequireBoardRole = RequireBoardRole;
//# sourceMappingURL=require-board-role.decorator.js.map