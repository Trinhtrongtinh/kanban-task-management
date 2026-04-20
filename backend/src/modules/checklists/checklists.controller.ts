import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import {
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from './dto';
import { ChecklistItem } from '../../database/entities';
import {
  CurrentUser,
  RequireBoardRole,
  ResponseMessage,
} from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { ChecklistBoardGuard } from '../../common/guards';
import { BoardRole } from '../../common/enums';
import {
  DangerousWriteRateLimit,
  WriteRateLimit,
} from '../../common/rate-limit';

@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Patch(':id')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Checklist updated successfully')
  async updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ) {
    return this.checklistsService.updateChecklist(id, updateChecklistDto);
  }

  @Delete(':id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Checklist deleted successfully')
  async removeChecklist(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.checklistsService.removeChecklist(id);
  }

  @Patch(':id/restore')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Checklist restored successfully')
  async restoreChecklist(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistsService.restoreChecklist(id);
  }

  @Post(':checklistId/items')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Checklist item created successfully')
  async createChecklistItem(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body() createChecklistItemDto: CreateChecklistItemDto,
  ): Promise<ChecklistItem> {
    return this.checklistsService.createChecklistItem({
      ...createChecklistItemDto,
      checklistId,
    });
  }

  @Patch('items/:id')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Checklist item updated successfully')
  async updateChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChecklistItemDto: UpdateChecklistItemDto,
    @CurrentUser('userId') userId: string,
  ): Promise<ChecklistItem> {
    return this.checklistsService.updateChecklistItem(
      id,
      updateChecklistItemDto,
      userId,
    );
  }

  @Delete('items/:id')
  @DangerousWriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Đã xóa mục thành công')
  async removeChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.checklistsService.removeChecklistItem(id);
  }

  @Patch('items/:id/restore')
  @WriteRateLimit()
  @UseGuards(JwtAuthGuard, ChecklistBoardGuard)
  @RequireBoardRole(BoardRole.ADMIN, BoardRole.EDITOR)
  @ResponseMessage('Checklist item restored successfully')
  async restoreChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChecklistItem> {
    return this.checklistsService.restoreChecklistItem(id);
  }
}
