export declare const CacheKeys: {
    workspacesByUser: (userId: string) => string;
    boardsByWorkspaceAndUser: (workspaceId: string, userId: string) => string;
    labelsByBoard: (boardId: string) => string;
    notificationsByUser: (userId: string) => string;
    notificationUnreadByUser: (userId: string) => string;
};
