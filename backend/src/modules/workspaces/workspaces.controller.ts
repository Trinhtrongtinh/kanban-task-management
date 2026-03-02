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
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';
import { Workspace } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ResponseMessage('Workspace created successfully')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @Get()
  @ResponseMessage('Workspaces retrieved successfully')
  async findAll(): Promise<Workspace[]> {
    return this.workspacesService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Workspace retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Workspace> {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Workspace updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }

  @Delete(':id')
  @ResponseMessage('Workspace deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.workspacesService.remove(id);
  }
}
