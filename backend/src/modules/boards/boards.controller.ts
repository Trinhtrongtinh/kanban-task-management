import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
  BadRequestException,
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
import { DangerousWriteRateLimit, ReadRateLimit, WriteRateLimit } from '../../common/rate-limit';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) { }

  @Post()
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Board created successfully')
  async create(
    @Body() createBoardDto: CreateBoardDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Board> {
    return this.boardsService.create(createBoardDto, userId);
  }

  @Get('workspace/:workspaceId')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @ResponseMessage('Boards retrieved successfully')
  async findAllByWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser('userId') userId: string,
    @Query('joinedOnly') joinedOnly?: string,
  ): Promise<Board[]> {
    return this.boardsService.findAllByWorkspace(
      workspaceId,
      userId,
      joinedOnly === 'true',
    );
  }

  @Get('workspace/:workspaceId/deleted')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @ResponseMessage('Deleted boards retrieved successfully')
  async findDeletedByWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<Board[]> {
    return this.boardsService.findDeletedByWorkspace(workspaceId);
  }

  @Get(':id')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @ResponseMessage('Board retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Board updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Board> {
    return this.boardsService.update(id, updateBoardDto, userId);
  }

  @Delete(':id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Board deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.boardsService.remove(id);
  }

  @Patch(':id/restore')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Board restored successfully')
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boardsService.restore(id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @ResponseMessage('Board members retrieved successfully')
  async getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.boardsService.getMembers(id);
  }

  @Post(':id/members')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Member added to board successfully')
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId') memberId: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!memberId) {
      throw new BadRequestException('Yêu cầu phải có userId');
    }
    return this.boardsService.addMember(id, memberId, userId);
  }

  @Delete(':id/members/:userId')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Member removed from board successfully')
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) memberId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.boardsService.removeMember(id, memberId, userId);
  }
}

