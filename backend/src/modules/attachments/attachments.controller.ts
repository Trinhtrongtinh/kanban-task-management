import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  BadRequestException,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
  Res,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError } from 'multer';
import { Observable, catchError, throwError } from 'rxjs';
import { AttachmentsService } from './attachments.service';
import { Attachment } from '../../database/entities';
import { CurrentUser, ResponseMessage } from '../../common/decorators';
import { multerOptions, MAX_FILE_SIZE } from './multer.config';
import { BusinessException } from '../../common/exceptions';
import { BoardRole, ErrorCode } from '../../common/enums';
import { JwtAuthGuard } from '../auth/guards';
import { AttachmentBoardGuard, CardBoardGuard } from '../../common/guards';
import { RequireBoardRole } from '../../common/decorators';
import {
  DangerousWriteRateLimit,
  ReadRateLimit,
  UploadRateLimit,
  WriteRateLimit,
} from '../../common/rate-limit';

/** Converts MulterError / oversized-payload errors into clean HTTP 400 responses. */
@Injectable()
class MulterExceptionInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof MulterError) {
          const message =
            err.code === 'LIMIT_FILE_SIZE'
              ? `File vượt quá giới hạn ${MAX_FILE_SIZE / 1024 / 1024}MB`
              : `Lỗi upload: ${err.message}`;
          return throwError(() => new BadRequestException(message));
        }
        return throwError(() => err);
      }),
    );
  }
}

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('cards/:cardId/attachments')
  @UploadRateLimit()
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('File uploaded successfully')
  @UseInterceptors(
    MulterExceptionInterceptor,
    FileInterceptor('file', multerOptions),
  )
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

  @Get('attachments/:id/download')
  @ReadRateLimit()
  @UseGuards(JwtAuthGuard, AttachmentBoardGuard)
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { attachment, absoluteFilePath } =
      await this.attachmentsService.getDownloadInfo(id);

    const encodedFileName = encodeURIComponent(attachment.fileName);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader('Content-Type', attachment.fileType || 'application/octet-stream');

    return new StreamableFile(fs.createReadStream(absoluteFilePath));
  }

  @Delete('attachments/:id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, AttachmentBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Attachment deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.attachmentsService.remove(id);
  }

  @Patch('attachments/:id/restore')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, AttachmentBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Attachment restored successfully')
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Attachment> {
    return this.attachmentsService.restore(id);
  }
}
