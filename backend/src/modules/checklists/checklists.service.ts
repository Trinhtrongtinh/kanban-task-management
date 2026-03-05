import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Checklist, ChecklistItem, Card } from '../../database/entities';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  BulkCreateChecklistItemDto,
  BulkDeleteChecklistItemDto,
} from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepository: Repository<ChecklistItem>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly dataSource: DataSource,
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
   * Calculate next position for a new checklist item
   */
  private async calculateNextPosition(checklistId: string): Promise<number> {
    const lastItem = await this.checklistItemRepository.findOne({
      where: { checklistId },
      order: { position: 'DESC' },
    });

    if (!lastItem) {
      return 1;
    }

    return lastItem.position + 1;
  }

  // ==================== CHECKLIST CRUD ====================

  async createChecklist(
    cardId: string,
    createChecklistDto: CreateChecklistDto,
  ): Promise<Checklist> {
    const { title } = createChecklistDto;

    // Validate card exists
    await this.validateCardExists(cardId);

    const checklist = this.checklistRepository.create({
      cardId,
      title,
    });

    return this.checklistRepository.save(checklist);
  }

  async findAllByCard(cardId: string): Promise<Checklist[]> {
    // Validate card exists
    await this.validateCardExists(cardId);

    return this.checklistRepository.find({
      where: { cardId },
      relations: ['items'],
      order: { items: { position: 'ASC' } },
    });
  }

  async findOneChecklist(id: string): Promise<Checklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id },
      relations: ['items'],
      order: { items: { position: 'ASC' } },
    });

    if (!checklist) {
      throw new BusinessException(ErrorCode.CHECKLIST_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return checklist;
  }

  async removeChecklist(id: string): Promise<void> {
    const checklist = await this.findOneChecklist(id);
    await this.checklistRepository.remove(checklist);
  }

  async updateChecklist(
    id: string,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<Checklist> {
    const checklist = await this.findOneChecklist(id);
    Object.assign(checklist, updateChecklistDto);
    return this.checklistRepository.save(checklist);
  }

  // ==================== CHECKLIST ITEM CRUD ====================

  async createChecklistItem(createChecklistItemDto: CreateChecklistItemDto & { checklistId: string }): Promise<ChecklistItem> {
    const { checklistId, content } = createChecklistItemDto;

    // Validate checklist exists
    await this.findOneChecklist(checklistId);

    // Calculate next position
    const position = await this.calculateNextPosition(checklistId);

    const item = this.checklistItemRepository.create({
      checklistId,
      content,
      position,
      isDone: false,
    });

    return this.checklistItemRepository.save(item);
  }

  async findOneChecklistItem(id: string): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new BusinessException(ErrorCode.CHECKLIST_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return item;
  }

  async updateChecklistItem(
    id: string,
    updateChecklistItemDto: UpdateChecklistItemDto,
  ): Promise<ChecklistItem> {
    const item = await this.findOneChecklistItem(id);

    Object.assign(item, updateChecklistItemDto);

    return this.checklistItemRepository.save(item);
  }

  async removeChecklistItem(id: string): Promise<void> {
    const item = await this.findOneChecklistItem(id);
    await this.checklistItemRepository.remove(item);
  }

  /**
   * Bulk create checklist items with transaction
   * Uses single INSERT statement for optimal performance
   * Position is provided by client to maintain exact user input order
   */
  async bulkCreateChecklistItems(
    checklistId: string,
    bulkCreateDto: BulkCreateChecklistItemDto,
  ): Promise<ChecklistItem[]> {
    // Validate checklist exists
    await this.findOneChecklist(checklistId);

    const { items } = bulkCreateDto;

    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      // Prepare entities with client-provided positions
      const checklistItems = items.map((item) =>
        manager.create(ChecklistItem, {
          checklistId,
          content: item.content,
          position: item.position,
          isDone: false,
        }),
      );

      // Bulk insert with single INSERT statement
      return manager.save(ChecklistItem, checklistItems);
    });
  }

  /**
   * Bulk delete checklist items with transaction
   * Uses single DELETE statement for optimal performance
   */
  async bulkDeleteChecklistItems(
    bulkDeleteDto: BulkDeleteChecklistItemDto,
  ): Promise<{ deletedCount: number }> {
    const { ids } = bulkDeleteDto;

    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      // Verify all items exist before deleting
      const existingItems = await manager.find(ChecklistItem, {
        where: { id: In(ids) },
        select: ['id'],
      });

      if (existingItems.length !== ids.length) {
        throw new BusinessException(
          ErrorCode.CHECKLIST_ITEM_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // Bulk delete with single DELETE statement
      const result = await manager.delete(ChecklistItem, { id: In(ids) });

      return { deletedCount: result.affected ?? 0 };
    });
  }
}
