/**
 * Workspace-level roles
 */
export enum WorkspaceRole {
  OWNER = 'OWNER', // Full control: delete workspace, manage all members
  ADMIN = 'ADMIN', // Can invite/manage members, manage boards
  MEMBER = 'MEMBER', // Can create boards in workspace
  OBSERVER = 'OBSERVER', // Read-only access
}

/**
 * Board-level roles
 */
export enum BoardRole {
  ADMIN = 'ADMIN', // Full control: delete board, manage settings, manage members
  EDITOR = 'EDITOR', // Can create/move/edit cards and lists
  VIEWER = 'VIEWER', // Read-only access
}

/**
 * Workspace member status
 */
export enum MemberStatus {
  PENDING = 'PENDING', // Invitation sent, waiting for acceptance
  ACTIVE = 'ACTIVE', // Member has accepted and is active
}
