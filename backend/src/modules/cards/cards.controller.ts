import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, MoveCardDto } from './dto';
import { Card, Checklist } from '../../database/entities';
import {
  ResponseMessage,
  CurrentUser,
  RequireBoardRole,
} from '../../common/decorators';
import { LabelsService } from '../labels/labels.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { CreateChecklistDto } from '../checklists/dto';
import { JwtAuthGuard } from '../auth/guards';
import { CardBoardGuard } from '../../common/guards';
import { BoardRole } from '../../common/enums';

@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly labelsService: LabelsService,
    private readonly checklistsService: ChecklistsService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Card created successfully')
  async create(
    @Body() createCardDto: CreateCardDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Card> {
    // If assigneeId not provided, auto-assign to current user
    if (!createCardDto.assigneeId) {
      createCardDto.assigneeId = userId;
    }
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
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Card updated successfully')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    return this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN)
  @ResponseMessage('Card deleted successfully')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cardsService.remove(id);
  }

  @Patch(':id/move')
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Card moved successfully')
  async moveCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moveCardDto: MoveCardDto,
    @CurrentUser('userId') userId: string,
  ): Promise<Card> {
    return this.cardsService.moveCard(id, moveCardDto, userId);
  }

  // Card-Label assignment endpoints
  @Post(':cardId/labels/:labelId')
  @ResponseMessage('Label assigned to card successfully')
  async addLabelToCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('labelId', ParseUUIDPipe) labelId: string,
  ): Promise<Card> {
    return this.labelsService.addLabelToCard(cardId, labelId);
  }

  @Delete(':cardId/labels/:labelId')
  @ResponseMessage('Label removed from card successfully')
  async removeLabelFromCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('labelId', ParseUUIDPipe) labelId: string,
  ): Promise<Card> {
    return this.labelsService.removeLabelFromCard(cardId, labelId);
  }

  // Card-Checklist endpoints
  @Post(':cardId/checklists')
  @ResponseMessage('Checklist created successfully')
  async createChecklist(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() createChecklistDto: CreateChecklistDto,
  ): Promise<Checklist> {
    return this.checklistsService.createChecklist(cardId, createChecklistDto);
  }

  @Get(':cardId/checklists')
  @ResponseMessage('Checklists retrieved successfully')
  async findChecklistsByCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<Checklist[]> {
    return this.checklistsService.findAllByCard(cardId);
  }

  // Card member (assignee) endpoints
  @Post(':cardId/members')
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR, BoardRole.VIEWER)
  @ResponseMessage('Member assigned to card successfully')
  async assignMember(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body('userId') userId: string,
  ): Promise<Card> {
    return this.cardsService.addMember(cardId, userId);
  }

  @Delete(':cardId/members/:userId')
  @UseGuards(JwtAuthGuard, CardBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR, BoardRole.VIEWER)
  @ResponseMessage('Member unassigned from card successfully')
  async unassignMember(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Card> {
    return this.cardsService.removeMember(cardId, userId);
  }
}

