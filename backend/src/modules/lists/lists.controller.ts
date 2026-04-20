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
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto } from './dto';
import { List } from '../../database/entities';
import { ResponseMessage, RequireBoardRole } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { BoardMemberGuard, ListBoardGuard } from '../../common/guards';
import { BoardRole } from '../../common/enums';
import {
  DangerousWriteRateLimit,
  ReadRateLimit,
  WriteRateLimit,
} from '../../common/rate-limit';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('List created successfully')
  async create(@Body() createListDto: CreateListDto): Promise<List> {
    return this.listsService.create(createListDto);
  }

  @Get('board/:boardId')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, ListBoardGuard)
  @ResponseMessage('Lists retrieved successfully')
  async findAllByBoard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
  ): Promise<List[]> {
    return this.listsService.findAllByBoard(boardId);
  }

  // @Get(':id')
  // @UseGuards(JwtAuthGuard, ListBoardGuard)
  // @ResponseMessage('List retrieved successfully')
  // async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<List> {
  //   return this.listsService.findOne(id);
  // }

  @Patch(':id')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ListBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('List updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateListDto: UpdateListDto,
  ): Promise<List> {
    return this.listsService.update(id, updateListDto);
  }

  @Delete(':id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, ListBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('List deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.listsService.remove(id);
  }

  @Patch(':id/restore')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ListBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('List restored successfully')
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<List> {
    return this.listsService.restore(id);
  }
}
