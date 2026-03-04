import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto } from './dto';
import { Card } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ResponseMessage('Card created successfully')
  async create(@Body() createCardDto: CreateCardDto): Promise<Card> {
    return this.cardsService.create(createCardDto);
  }

  @Get('list/:listId')
  @ResponseMessage('Cards retrieved successfully')
  async findAllByList(
    @Param('listId', ParseUUIDPipe) listId: string,
  ): Promise<Card[]> {
    return this.cardsService.findAllByList(listId);
  }

  @Get(':id')
  @ResponseMessage('Card retrieved successfully')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Card> {
    return this.cardsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Card updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    return this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  @ResponseMessage('Card deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cardsService.remove(id);
  }
}
