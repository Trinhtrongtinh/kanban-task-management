import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto';
import { Board } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ResponseMessage('Board created successfully')
  async create(@Body() createBoardDto: CreateBoardDto): Promise<Board> {
    return this.boardsService.create(createBoardDto);
  }

  @Get('workspace/:workspaceId')
  @ResponseMessage('Boards retrieved successfully')
  async findAllByWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<Board[]> {
    return this.boardsService.findAllByWorkspace(workspaceId);
  }

  @Get(':id')
  @ResponseMessage('Board retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Board> {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Board updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<Board> {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @ResponseMessage('Board deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.boardsService.remove(id);
  }
}
