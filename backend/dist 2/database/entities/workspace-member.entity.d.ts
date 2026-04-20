import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { WorkspaceRole, MemberStatus } from '../../common/enums';
export declare class WorkspaceMember {
    id: string;
    workspaceId: string;
    workspace: Workspace;
    userId: string;
    user: User;
    role: WorkspaceRole;
    status: MemberStatus;
    inviteToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}
