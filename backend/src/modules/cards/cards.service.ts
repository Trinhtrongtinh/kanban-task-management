import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, List } from '../../database/entities';
import { CreateCardDto, UpdateCardDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

// Default position increment for new cards
const POSITION_GAP = 65535;

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
  ) {}

  /**
   * Validate list exists
   */
  private async validateListExists(listId: string): Promise<void> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
    });

    if (!list) {
      throw new BusinessException(ErrorCode.LIST_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Calculate position for a new card
   * Gets the last card's position and adds POSITION_GAP
   */
  private async calculateNewPosition(listId: string): Promise<number> {
    const lastCard = await this.cardRepository.findOne({
      where: { listId },
      order: { position: 'DESC' },
    });

    if (!lastCard) {
      return POSITION_GAP;
    }

    return lastCard.position + POSITION_GAP;
  }

  async create(createCardDto: CreateCardDto): Promise<Card> {
    const { title, listId, deadline, ...rest } = createCardDto;

    // Validate list exists
    await this.validateListExists(listId);

    // Calculate position automatically
    const position = await this.calculateNewPosition(listId);

    const card = this.cardRepository.create({
      title,
      listId,
      position,
      deadline: deadline ? new Date(deadline) : null,
      ...rest,
    });

    return this.cardRepository.save(card);
  }

  async findAllByList(listId: string): Promise<Card[]> {
    // Validate list exists
    await this.validateListExists(listId);

    return this.cardRepository.find({
      where: { listId, isArchived: false },
      relations: ['labels'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['list', 'labels'],
    });

    if (!card) {
      throw new BusinessException(ErrorCode.CARD_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id);

    const { listId, deadline, ...rest } = updateCardDto;

    // If moving to another list, validate target list exists
    if (listId && listId !== card.listId) {
      await this.validateListExists(listId);
      card.listId = listId;

      // If position is not provided, calculate new position in target list
      if (!updateCardDto.position) {
        card.position = await this.calculateNewPosition(listId);
      }
    }

    // Handle deadline
    if (deadline !== undefined) {
      card.deadline = deadline ? new Date(deadline) : null;
    }

    Object.assign(card, rest);

    return this.cardRepository.save(card);
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);
    await this.cardRepository.remove(card);
  }
}
