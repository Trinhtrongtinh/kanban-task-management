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
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { Comment } from '../../database/entities';
import { ResponseMessage, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('cards/:cardId/comments')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Comment created successfully')
  async create(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Comment> {
    return this.commentsService.create(cardId, createCommentDto, userId);
  }

  @Get('cards/:cardId/comments')
  @ResponseMessage('Comments retrieved successfully')
  async findAllByCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<Comment[]> {
    return this.commentsService.findAllByCard(cardId);
  }

  @Patch('comments/:id')
  @ResponseMessage('Comment updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete('comments/:id')
  @ResponseMessage('Comment deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commentsService.remove(id);
  }
}
