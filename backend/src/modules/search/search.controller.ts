import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { GlobalSearchDto, AdvancedSearchDto } from './dto';
import { ResponseMessage } from '../../common/decorators';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Global search across workspaces, boards, and cards
   * GET /search/global?q=keyword
   */
  @Get('global')
  @ResponseMessage('Tìm kiếm thành công')
  async globalSearch(@Query() dto: GlobalSearchDto) {
    return this.searchService.globalSearch(dto);
  }

/* *
 * Advanced search with filters
 * GET /search/advanced?boardId=&labelIds=&dueDate=
*/
  @Get('advanced')
  @ResponseMessage('Tìm kiếm nâng cao thành công')
  async advancedSearch(@Query() dto: AdvancedSearchDto) {
    return this.searchService.advancedSearch(dto);
  }
}
