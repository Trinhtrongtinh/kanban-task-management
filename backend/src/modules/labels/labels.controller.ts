import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto';
import { Label } from '../../database/entities';
import { RequireBoardRole, ResponseMessage } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { BoardMemberGuard } from '../../common/guards';
import { BoardRole } from '../../common/enums';
import { ReadRateLimit } from '../../common/rate-limit';

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post('labels')
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Label created successfully')
  async create(@Body() createLabelDto: CreateLabelDto): Promise<Label> {
    return this.labelsService.create(createLabelDto);
  }

  @Get('labels/board/:boardId')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, BoardMemberGuard)
  @ResponseMessage('Labels retrieved successfully')
  async findAllByBoard(
    @Param('boardId', ParseUUIDPipe) boardId: string,
  ): Promise<Label[]> {
    return this.labelsService.findAllByBoard(boardId);
  }
}
