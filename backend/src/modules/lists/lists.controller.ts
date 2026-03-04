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
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto } from './dto';
import { List } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ResponseMessage('List created successfully')
  async create(@Body() createListDto: CreateListDto): Promise<List> {
    return this.listsService.create(createListDto);
  }

  @Get('board/:boardId')
  @ResponseMessage('Lists retrieved successfully')
  async findAllByBoard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
  ): Promise<List[]> {
    return this.listsService.findAllByBoard(boardId);
  }

  @Get(':id')
  @ResponseMessage('List retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<List> {
    return this.listsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('List updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateListDto: UpdateListDto,
  ): Promise<List> {
    return this.listsService.update(id, updateListDto);
  }

  @Delete(':id')
  @ResponseMessage('List deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.listsService.remove(id);
  }
}
