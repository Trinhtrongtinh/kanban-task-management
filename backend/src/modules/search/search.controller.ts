import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { GlobalSearchDto } from './dto';
import { ResponseMessage, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards';
import { SearchRateLimit } from '../../common/rate-limit';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Global search across workspaces, boards, and cards
   * GET /search/global?q=keyword
   */
  @Get('global')
  @SearchRateLimit()
  @ResponseMessage('Tìm kiếm thành công')
  async globalSearch(
    @Query() dto: GlobalSearchDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.searchService.globalSearch(dto, userId);
  }
}
