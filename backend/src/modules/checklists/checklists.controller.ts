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
import { ChecklistsService } from './checklists.service';
import {
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  BulkCreateChecklistItemDto,
  BulkDeleteChecklistItemDto,
} from './dto';
import { Checklist, ChecklistItem } from '../../database/entities';
import { ResponseMessage } from '../../common/decorators';

@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // ==================== CHECKLIST ENDPOINTS ====================

  @Get(':id')
  @ResponseMessage('Checklist retrieved successfully')
  async findOneChecklist(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Checklist> {
    return this.checklistsService.findOneChecklist(id);
  }

  @Patch(':id')
  @ResponseMessage('Checklist updated successfully')
  async updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ): Promise<Checklist> {
    return this.checklistsService.updateChecklist(id, updateChecklistDto);
  }

  @Delete(':id')
  @ResponseMessage('Checklist deleted successfully')
  async removeChecklist(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.checklistsService.removeChecklist(id);
  }

  // ==================== CHECKLIST ITEM ENDPOINTS ====================

  @Post(':checklistId/items')
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

  @Delete('items/bulk')
  @ResponseMessage('Đã xóa hàng loạt thành công')
  async bulkDeleteChecklistItems(
    @Body() bulkDeleteDto: BulkDeleteChecklistItemDto,
  ): Promise<{ deletedCount: number }> {
    return this.checklistsService.bulkDeleteChecklistItems(bulkDeleteDto);
  }

  @Patch('items/:id')
  @ResponseMessage('Checklist item updated successfully')
  async updateChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChecklistItemDto: UpdateChecklistItemDto,
  ): Promise<ChecklistItem> {
    return this.checklistsService.updateChecklistItem(
      id,
      updateChecklistItemDto,
    );
  }

  @Delete('items/:id')
  @ResponseMessage('Đã xóa mục thành công')
  async removeChecklistItem(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.checklistsService.removeChecklistItem(id);
  }

  @Post(':checklistId/items/bulk')
  @ResponseMessage('Đã lưu danh sách công việc thành công')
  async bulkCreateChecklistItems(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body() bulkCreateDto: BulkCreateChecklistItemDto,
  ): Promise<ChecklistItem[]> {
    return this.checklistsService.bulkCreateChecklistItems(
      checklistId,
      bulkCreateDto,
    );
  }
}
