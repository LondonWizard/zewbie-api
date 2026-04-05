import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { SearchProductsSchema } from './dto/catalog.dto';
import type { SearchProductsDto } from './dto/catalog.dto';

@ApiTags('Catalog')
@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  getProducts(
    @Query(new ZodValidationPipe(SearchProductsSchema)) query: SearchProductsDto,
  ) {
    return this.catalogService.search(query);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  @Get('products/slug/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.findBySlug(slug);
  }

  @Get('categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('featured')
  getFeatured() {
    return this.catalogService.getFeatured();
  }
}
