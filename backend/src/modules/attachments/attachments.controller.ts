import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { Attachment } from '../../database/entities';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { multerOptions } from './multer.config';
import { BusinessException } from '../../common/exceptions';
import { BoardRole, ErrorCode } from '../../common/enums';
import { JwtAuthGuard } from '../auth/guards';
import { AttachmentBoardGuard, CardBoardGuard } from '../../common/guards';
import { RequireBoardRole } from '../../common/decorators';
import { DangerousWriteRateLimit, ReadRateLimit, UploadRateLimit } from '../../common/rate-limit';

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('cards/:cardId/attachments')
  @UploadRateLimit()
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('File uploaded successfully')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ): Promise<Attachment> {
    if (!file) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_UPLOAD_FAILED,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.attachmentsService.create(cardId, file, userId);
  }

  @Get('cards/:cardId/attachments')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @ResponseMessage('Attachments retrieved successfully')
  async findAllByCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<Attachment[]> {
    return this.attachmentsService.findAllByCard(cardId);
  }

  @Delete('attachments/:id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, AttachmentBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Attachment deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attachmentsService.remove(id);
  }
}
