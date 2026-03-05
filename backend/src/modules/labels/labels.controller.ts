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
import { LabelsService } from './labels.service';
import { CreateLabelDto, UpdateLabelDto } from './dto';
import { Label } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post('labels')
  @ResponseMessage('Label created successfully')
  async create(@Body() createLabelDto: CreateLabelDto): Promise<Label> {
    return this.labelsService.create(createLabelDto);
  }

  @Get('labels/board/:boardId')
  @ResponseMessage('Labels retrieved successfully')
  async findAllByBoard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
  ): Promise<Label[]> {
    return this.labelsService.findAllByBoard(boardId);
  }

  @Get('labels/:id')
  @ResponseMessage('Label retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Label> {
    return this.labelsService.findOne(id);
  }

  @Patch('labels/:id')
  @ResponseMessage('Label updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLabelDto: UpdateLabelDto,
  ): Promise<Label> {
    return this.labelsService.update(id, updateLabelDto);
  }

  @Delete('labels/:id')
  @ResponseMessage('Label deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.labelsService.remove(id);
  }
}
