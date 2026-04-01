import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  getProducts() {
    return { message: 'GET /catalog/products - placeholder', status: 'not_implemented' };
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return { message: `GET /catalog/products/${id} - placeholder`, status: 'not_implemented' };
  }

  @Get('categories')
  getCategories() {
    return { message: 'GET /catalog/categories - placeholder', status: 'not_implemented' };
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return { message: `GET /catalog/categories/${id} - placeholder`, status: 'not_implemented' };
  }

  @Get('search')
  search() {
    return { message: 'GET /catalog/search - placeholder', status: 'not_implemented' };
  }

  @Get('featured')
  getFeatured() {
    return { message: 'GET /catalog/featured - placeholder', status: 'not_implemented' };
  }
}
