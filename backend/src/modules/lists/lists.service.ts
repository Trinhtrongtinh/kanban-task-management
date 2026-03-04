import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List, Board } from '../../database/entities';
import { CreateListDto, UpdateListDto } from './dto';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

// Default position increment for new lists
const POSITION_GAP = 65535;

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  /**
   * Validate board exists
   */
  private async validateBoardExists(boardId: string): Promise<void> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new BusinessException(ErrorCode.BOARD_NOT_FOUND, HttpStatus.NOT_FOUND);
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

    // Validate board exists
    await this.validateBoardExists(boardId);

    // Calculate position automatically
    const position = await this.calculateNewPosition(boardId);

    const list = this.listRepository.create({
      title,
      boardId,
      position,
    });

    return this.listRepository.save(list);
  }

  async findAllByBoard(boardId: string): Promise<List[]> {
    // Validate board exists
    await this.validateBoardExists(boardId);

    return this.listRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<List> {
    const list = await this.listRepository.findOne({
      where: { id },
      relations: ['board'],
    });

    if (!list) {
      throw new BusinessException(ErrorCode.LIST_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return list;
  }

  async update(id: string, updateListDto: UpdateListDto): Promise<List> {
    const list = await this.findOne(id);

    Object.assign(list, updateListDto);

    return this.listRepository.save(list);
  }

  async remove(id: string): Promise<void> {
    const list = await this.findOne(id);
    await this.listRepository.remove(list);
  }
}
