import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { List, Board, Card, Attachment } from '../../database/entities';
import { CreateListDto, UpdateListDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';
import { CardsGateway } from '../cards/cards.gateway';

// Default position increment for new lists
const POSITION_GAP = 65535;

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    private readonly cardsGateway: CardsGateway,
    private readonly dataSource: DataSource,
  ) {}

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
   * Calculate position for a new list
   * Gets the last list's position and adds POSITION_GAP
   */
  private async calculateNewPosition(boardId: string): Promise<number> {
    const lastList = await this.listRepository.findOne({
      where: { boardId },
      order: { position: 'DESC' },
    });

    if (!lastList) {
      return POSITION_GAP;
    }

    return lastList.position + POSITION_GAP;
  }

  async create(createListDto: CreateListDto): Promise<List> {
    const { title, boardId } = createListDto;
    const normalizedTitle = title.trim();

    // Validate board exists
    await this.validateBoardExists(boardId);

    const existingListWithSameTitle = await this.listRepository
      .createQueryBuilder('list')
      .where('list.board_id = :boardId', { boardId })
      .andWhere('list.deleted_at IS NULL')
      .andWhere('LOWER(TRIM(list.title)) = LOWER(TRIM(:title))', {
        title: normalizedTitle,
      })
      .getOne();

    if (existingListWithSameTitle) {
      throw new BusinessException(
        ErrorCode.LIST_TITLE_EXISTS,
        HttpStatus.CONFLICT,
        'Tên danh sách đã tồn tại trong bảng này',
      );
    }

    // Calculate position automatically
    const position = await this.calculateNewPosition(boardId);

    const list = this.listRepository.create({
      title: normalizedTitle,
      boardId,
      position,
    });

    const savedList = await this.listRepository.save(list);
    this.cardsGateway.emitListCreated(savedList.boardId, savedList);
    return savedList;
  }

  async findAllByBoard(boardId: string): Promise<List[]> {
    // Validate board exists
    await this.validateBoardExists(boardId);

    return this.listRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
      relations: [
        'cards',
        'cards.labels',
        'cards.assignee',
        'cards.members',
        'cards.attachments',
      ],
    });
  }

  async findOne(id: string): Promise<List> {
    const list = await this.listRepository.findOne({
      where: { id },
      relations: ['board'],
    });

    if (!list) {
      throw new BusinessException(
        ErrorCode.LIST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return list;
  }

  async update(id: string, updateListDto: UpdateListDto): Promise<List> {
    const list = await this.findOne(id);

    if (updateListDto.title) {
      const normalizedTitle = updateListDto.title.trim();
      const existingListWithSameTitle = await this.listRepository
        .createQueryBuilder('l')
        .where('l.board_id = :boardId', { boardId: list.boardId })
        .andWhere('l.id != :id', { id: list.id })
        .andWhere('l.deleted_at IS NULL')
        .andWhere('LOWER(TRIM(l.title)) = LOWER(TRIM(:title))', {
          title: normalizedTitle,
        })
        .getOne();

      if (existingListWithSameTitle) {
        throw new BusinessException(
          ErrorCode.LIST_TITLE_EXISTS,
          HttpStatus.CONFLICT,
          'Tên danh sách đã tồn tại trong bảng này',
        );
      }

      updateListDto.title = normalizedTitle;
    }

    Object.assign(list, updateListDto);

    const updatedList = await this.listRepository.save(list);
    this.cardsGateway.emitListUpdated(updatedList.boardId, updatedList);
    return updatedList;
  }

  async remove(id: string): Promise<void> {
    const list = await this.findOne(id);
    const boardId = list.boardId;

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .softDelete()
        .from(Attachment)
        .where(
          'card_id IN (SELECT id FROM cards WHERE list_id = :listId AND deleted_at IS NULL)',
          {
            listId: id,
          },
        )
        .execute();

      await manager.softDelete(Card, { listId: id });
      await manager.softDelete(List, { id });
    });

    this.cardsGateway.emitListDeleted(boardId, { id, boardId });
  }

  async restore(id: string): Promise<List> {
    const list = await this.listRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!list) {
      throw new BusinessException(
        ErrorCode.LIST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!list.deletedAt) {
      return this.findOne(id);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.restore(List, { id });
      await manager
        .createQueryBuilder()
        .restore()
        .from(Card)
        .where('list_id = :listId', { listId: id })
        .execute();
      await manager
        .createQueryBuilder()
        .restore()
        .from(Attachment)
        .where('card_id IN (SELECT id FROM cards WHERE list_id = :listId)', {
          listId: id,
        })
        .execute();
    });

    const restored = await this.findOne(id);
    this.cardsGateway.emitListUpdated(restored.boardId, restored);
    return restored;
  }
}
