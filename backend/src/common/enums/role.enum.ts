/**
 * Workspace-level roles
 */
export enum WorkspaceRole {
  OWNER = 'OWNER',   // Full control: delete workspace, manage members
  MEMBER = 'MEMBER', // Can create boards in workspace
}

/**
 * Board-level roles
 */
export enum BoardRole {
  ADMIN = 'ADMIN',   // Full control: delete board, manage settings, manage members
  EDITOR = 'EDITOR', // Can create/move/edit cards and lists
  VIEWER = 'VIEWER', // Read-only access
}
