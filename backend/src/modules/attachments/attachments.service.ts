import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment, Card } from '../../database/entities';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode, ActivityAction } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Remove a file from disk asynchronously, ignoring missing-file errors.
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // file may not exist — safe to ignore
    }
  }

  /**
   * Validate card exists
   */
  private async validateCardExists(cardId: string): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Upload and create attachment
   */
  async create(
    cardId: string,
    file: Express.Multer.File,
    userId?: string,
  ): Promise<Attachment> {
    // Validate card exists
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list'],
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!file) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_UPLOAD_FAILED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const storedPath = path.join(
      process.cwd(),
      'uploads',
      'attachments',
      file.filename,
    );

    let savedAttachment: Attachment;
    try {
      const attachment = this.attachmentRepository.create({
        cardId,
        fileName: file.originalname,
        fileUrl: `/uploads/attachments/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
      });

      savedAttachment = await this.attachmentRepository.save(attachment);
    } catch (err) {
      // DB save failed — remove the already-written file so disk doesn't leak
      await this.cleanupFile(storedPath);
      throw err;
    }

    // Log activity: attachment added
    if (userId) {
      this.activitiesService
        .createLog({
          userId,
          boardId: card.list.boardId,
          cardId,
          action: ActivityAction.ATTACHMENT_ADDED,
          entityTitle: file.originalname,
          details: {
            cardTitle: card.title,
            fileType: file.mimetype,
            fileSize: file.size,
          },
          content: `Đã đính kèm file "${file.originalname}" vào thẻ "${card.title}"`,
        })
        .catch((err) =>
          this.logger.error('Failed to log attachment activity', err),
        );
    }

    return savedAttachment;
  }

  /**
   * Get all attachments for a card
   */
  async findAllByCard(cardId: string): Promise<Attachment[]> {
    // Validate card exists
    await this.validateCardExists(cardId);

    return this.attachmentRepository.find({
      where: { cardId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find one attachment by ID
   */
  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return attachment;
  }

  /**
   * Resolve the attachment file path for authenticated download.
   */
  async getDownloadInfo(
    id: string,
  ): Promise<{ attachment: Attachment; absoluteFilePath: string }> {
    const attachment = await this.findOne(id);

    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const relativeFilePath = attachment.fileUrl.replace(/^\/+/, '');
    const absoluteFilePath = path.resolve(process.cwd(), relativeFilePath);

    // Prevent path traversal and ensure files stay under uploads root.
    if (
      absoluteFilePath !== uploadsRoot &&
      !absoluteFilePath.startsWith(`${uploadsRoot}${path.sep}`)
    ) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      await fs.promises.access(absoluteFilePath, fs.constants.R_OK);
    } catch {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return { attachment, absoluteFilePath };
  }

  async restore(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!attachment) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!attachment.deletedAt) {
      return attachment;
    }

    await this.attachmentRepository.restore(id);

    const restored = await this.attachmentRepository.findOne({ where: { id } });
    if (!restored) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return restored;
  }

  /**
   * Delete attachment (DB record + physical file)
   */
  async remove(id: string): Promise<void> {
    const attachment = await this.findOne(id);

    // Soft delete to allow undo/restore.
    await this.attachmentRepository.softDelete(attachment.id);
  }
}
