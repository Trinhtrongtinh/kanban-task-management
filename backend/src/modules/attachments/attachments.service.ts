import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment, Card } from '../../database/entities';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  /**
   * Validate card exists
   */
  private async validateCardExists(cardId: string): Promise<void> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Upload and create attachment
   */
  async create(
    cardId: string,
    file: Express.Multer.File,
  ): Promise<Attachment> {
    // Validate card exists
    await this.validateCardExists(cardId);

    if (!file) {
      throw new BusinessException(
        ErrorCode.ATTACHMENT_UPLOAD_FAILED,
        HttpStatus.BAD_REQUEST,
      );
    }

    const attachment = this.attachmentRepository.create({
      cardId,
      fileName: file.originalname,
      fileUrl: `/uploads/attachments/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
    });

    return this.attachmentRepository.save(attachment);
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
   * Delete attachment (DB record + physical file)
   */
  async remove(id: string): Promise<void> {
    const attachment = await this.findOne(id);

    // Delete physical file
    const filePath = path.join(process.cwd(), attachment.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await this.attachmentRepository.remove(attachment);
  }
}
