"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = void 0;
exports.CacheKeys = {
    workspacesByUser: (userId) => `v1:workspaces:user:${userId}`,
    boardsByWorkspaceAndUser: (workspaceId, userId) => `v1:boards:workspace:${workspaceId}:user:${userId}`,
    labelsByBoard: (boardId) => `v1:labels:board:${boardId}`,
    notificationsByUser: (userId) => `v1:notifications:user:${userId}`,
    notificationUnreadByUser: (userId) => `v1:notifications:unread:user:${userId}`,
};
//# sourceMappingURL=cache-keys.js.map