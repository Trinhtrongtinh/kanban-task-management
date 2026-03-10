import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { Board } from '../../database/entities';
import {
  ResponseMessage,
  CurrentUser,
  RequireBoardRole,
  RequireWorkspaceRole,
} from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { BoardMemberGuard, WorkspaceMemberGuard } from '../../common/guards';
import { BoardRole, WorkspaceRole } from '../../common/enums';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Board created successfully')
  async create(
    @Body() createBoardDto: CreateBoardDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Board> {
    return this.boardsService.create(createBoardDto, userId);
  }

  @Get('workspace/:workspaceId')
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @ResponseMessage('Boards retrieved successfully')
  async findAllByWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<Board[]> {
    return this.boardsService.findAllByWorkspace(workspaceId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @ResponseMessage('Board retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Board updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<Board> {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Board deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.boardsService.remove(id);
  }
}
