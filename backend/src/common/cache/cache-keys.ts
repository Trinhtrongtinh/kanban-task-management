export const CacheKeys = {
  workspacesByUser: (userId: string) => `v1:workspaces:user:${userId}`,
  boardsByWorkspaceAndUser: (workspaceId: string, userId: string) =>
    `v1:boards:workspace:${workspaceId}:user:${userId}`,
  labelsByBoard: (boardId: string) => `v1:labels:board:${boardId}`,
  notificationsByUser: (userId: string) => `v1:notifications:user:${userId}`,
  notificationUnreadByUser: (userId: string) =>
    `v1:notifications:unread:user:${userId}`,
};
