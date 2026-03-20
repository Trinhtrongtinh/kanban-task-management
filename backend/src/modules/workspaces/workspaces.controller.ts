import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from './dto';
import { Workspace, WorkspaceMember } from '../../database/entities';
import {
  ResponseMessage,
  CurrentUser,
  RequireWorkspaceRole,
} from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { WorkspaceMemberGuard } from '../../common/guards';
import { WorkspaceRole } from '../../common/enums';
import { DangerousWriteRateLimit, ReadRateLimit, WriteRateLimit } from '../../common/rate-limit';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Workspace created successfully')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Workspace> {
    return this.workspacesService.create(createWorkspaceDto, userId);
  }

  @Get()
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Workspaces retrieved successfully')
  async findAll(@CurrentUser('userId') userId: string): Promise<Workspace[]> {
    return this.workspacesService.findAllByUser(userId);
  }

  @Get(':id')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @ResponseMessage('Workspace retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Workspace> {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @ResponseMessage('Workspace updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }

  @Delete(':id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') requesterId: string,
  ): Promise<void> {
    return this.workspacesService.remove(id, requesterId);
  }

  /**
   * Invite a member to workspace
   * Only OWNER or ADMIN can invite
   */
  @Post(':id/invite')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ResponseMessage('Lời mời đã được gửi thành công')
  async inviteMember(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @CurrentUser('userId') userId: string,
  ): Promise<WorkspaceMember> {
    return this.workspacesService.inviteMember(
      workspaceId,
      inviteMemberDto,
      userId,
    );
  }

  /**
   * Accept invitation and join workspace
   * Using GET so user can click link from email
   */
  @Get(':id/accept-invite')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Bạn đã tham gia workspace thành công')
  async acceptInvitation(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Query('token') token: string,
    @CurrentUser('userId') userId: string,
  ): Promise<WorkspaceMember> {
    return this.workspacesService.acceptInvitation(workspaceId, token, userId);
  }

  /**
   * Get workspace members
   */
  @Get(':id/members')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @ResponseMessage('Members retrieved successfully')
  async getMembers(
    @Param('id', ParseUUIDPipe) workspaceId: string,
  ): Promise<WorkspaceMember[]> {
    return this.workspacesService.getMembers(workspaceId);
  }

  @Delete(':id/members/:memberId')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser('userId') requesterId: string,
  ): Promise<void> {
    return this.workspacesService.removeMember(workspaceId, memberId, requesterId);
  }
}
