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
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';
import { Workspace } from '../../database/entities';
import { ResponseMessage, CurrentUser, RequireWorkspaceRole } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { WorkspaceMemberGuard } from '../../common/guards';
import { WorkspaceRole } from '../../common/enums';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Workspace created successfully')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Workspace> {
    return this.workspacesService.create(createWorkspaceDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Workspaces retrieved successfully')
  async findAll(@CurrentUser('userId') userId: string): Promise<Workspace[]> {
    return this.workspacesService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @ResponseMessage('Workspace retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Workspace> {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
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
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @ResponseMessage('Workspace deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.workspacesService.remove(id);
  }
}
