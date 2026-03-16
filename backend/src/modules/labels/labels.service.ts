import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label, Board, Card } from '../../database/entities';
import { CreateLabelDto, UpdateLabelDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { AppCacheService, CACHE_TTL, CacheKeys } from '../../common/cache';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly cacheService: AppCacheService,
  ) {}

  private async invalidateBoardLabels(boardId: string): Promise<void> {
    await this.cacheService.del(CacheKeys.labelsByBoard(boardId));
  }

  /**
   * Validate board exists
   */
  private async validateBoardExists(boardId: string): Promise<void> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new BusinessException(
        ErrorCode.BOARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Validate card exists and return it with labels
   */
  private async getCardWithLabels(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['labels'],
    });

    if (!card) {
      throw new BusinessException(
        ErrorCode.CARD_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return card;
  }

  async create(createLabelDto: CreateLabelDto): Promise<Label> {
    const { boardId, ...rest } = createLabelDto;

    // Validate board exists
    await this.validateBoardExists(boardId);

    const label = this.labelRepository.create({
      boardId,
      ...rest,
    });

    const savedLabel = await this.labelRepository.save(label);
    await this.invalidateBoardLabels(boardId);
    return savedLabel;
  }

  async findAllByBoard(boardId: string): Promise<Label[]> {
    const cacheKey = CacheKeys.labelsByBoard(boardId);
    const cached = await this.cacheService.get<Label[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Validate board exists
    await this.validateBoardExists(boardId);

    const labels = await this.labelRepository.find({
      where: { boardId },
    });

    await this.cacheService.set(
      cacheKey,
      labels,
      CACHE_TTL.LABELS_BY_BOARD_SECONDS,
    );

    return labels;
  }

  async findOne(id: string): Promise<Label> {
    const label = await this.labelRepository.findOne({
      where: { id },
      relations: ['board'],
    });

    if (!label) {
      throw new BusinessException(
        ErrorCode.LABEL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return label;
  }

  async update(id: string, updateLabelDto: UpdateLabelDto): Promise<Label> {
    const label = await this.findOne(id);

    Object.assign(label, updateLabelDto);

    const updated = await this.labelRepository.save(label);
    await this.invalidateBoardLabels(label.boardId);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const label = await this.findOne(id);
    await this.labelRepository.remove(label);
    await this.invalidateBoardLabels(label.boardId);
  }

  /**
   * Add a label to a card
   */
  async addLabelToCard(cardId: string, labelId: string): Promise<Card> {
    const card = await this.getCardWithLabels(cardId);
    const label = await this.findOne(labelId);

    // Check if label is already assigned
    const isAlreadyAssigned = card.labels.some((l) => l.id === labelId);
    if (isAlreadyAssigned) {
      throw new BusinessException(
        ErrorCode.LABEL_ALREADY_ASSIGNED,
        HttpStatus.CONFLICT,
      );
    }

    card.labels.push(label);
    return this.cardRepository.save(card);
  }

  /**
   * Remove a label from a card
   */
  async removeLabelFromCard(cardId: string, labelId: string): Promise<Card> {
    const card = await this.getCardWithLabels(cardId);

    // Check if label is assigned
    const labelIndex = card.labels.findIndex((l) => l.id === labelId);
    if (labelIndex === -1) {
      throw new BusinessException(
        ErrorCode.LABEL_NOT_ASSIGNED,
        HttpStatus.BAD_REQUEST,
      );
    }

    card.labels.splice(labelIndex, 1);
    return this.cardRepository.save(card);
  }
}
