import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ContentCreatorService } from '../../../modules/admin/content-creators/services/content-creator.service';
import { CategoriesService } from '../../../modules/admin/categories/categories.service';
import { RatiosService } from '../../../modules/admin/ratios/ratios.service';

@ApiTags('Public - Content')
@Controller('public/content')
export class PublicContentController {
  constructor(
    private readonly contentCreatorService: ContentCreatorService,
    private readonly categoriesService: CategoriesService,
    private readonly ratiosService: RatiosService,
  ) {
    console.log('PublicContentController initialized');
  }

  @Get('creators')
  @ApiOperation({ summary: 'Get all active content creators' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'tag', required: false, type: String })
  @ApiQuery({ name: 'ratio', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'rating', 'createdAt', 'updatedAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of active content creators' })
  async getContentCreators(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('ratio') ratio?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    console.log('PublicContentController.getContentCreators called', { page, limit, category, tag, ratio, search, sortBy, sortOrder });
    try {
      const result = await this.contentCreatorService.findAll({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        status: 'active', // Only show active creators
        category,
        tag,
        ratio,
        sortBy: sortBy as any,
        sortOrder: sortOrder || 'asc',
      });
      console.log('PublicContentController.getContentCreators result', { count: result.data?.length });
      return result;
    } catch (error) {
      console.error('PublicContentController.getContentCreators error', error);
      throw error;
    }
  }

  @Get('creators/:id')
  @ApiOperation({ summary: 'Get a content creator by ID' })
  @ApiResponse({ status: 200, description: 'Content creator found' })
  @ApiResponse({ status: 404, description: 'Content creator not found' })
  async getContentCreator(@Param('id') id: string) {
    return this.contentCreatorService.findOne(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories() {
    console.log('PublicContentController.getCategories called');
    try {
      const result = await this.categoriesService.findAll();
      console.log('PublicContentController.getCategories result', { count: result?.length });
      return result;
    } catch (error) {
      console.error('PublicContentController.getCategories error', error);
      throw error;
    }
  }

  @Get('ratios')
  @ApiOperation({ summary: 'Get all ratios' })
  @ApiResponse({ status: 200, description: 'List of ratios' })
  async getRatios() {
    console.log('PublicContentController.getRatios called');
    try {
      const result = await this.ratiosService.findAll();
      console.log('PublicContentController.getRatios result', { count: result?.length });
      return result;
    } catch (error) {
      console.error('PublicContentController.getRatios error', error);
      throw error;
    }
  }
}
