import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from './dto';
import { Workspace, WorkspaceMember } from '../../database/entities';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    create(createWorkspaceDto: CreateWorkspaceDto, userId: string): Promise<Workspace>;
    findAll(userId: string): Promise<Workspace[]>;
    findDeletedOwned(userId: string): Promise<Workspace[]>;
    findOne(id: string): Promise<Workspace>;
    update(id: string, updateWorkspaceDto: UpdateWorkspaceDto): Promise<Workspace>;
    remove(id: string, requesterId: string): Promise<void>;
    restore(id: string, requesterId: string): Promise<Workspace>;
    inviteMember(workspaceId: string, inviteMemberDto: InviteMemberDto, userId: string): Promise<WorkspaceMember>;
    acceptInvitation(workspaceId: string, token: string, userId: string): Promise<WorkspaceMember>;
    getMembers(workspaceId: string): Promise<WorkspaceMember[]>;
    removeMember(workspaceId: string, memberId: string, requesterId: string): Promise<void>;
}
