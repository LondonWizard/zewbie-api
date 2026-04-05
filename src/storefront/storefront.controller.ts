import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorefrontService } from './storefront.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Storefront')
@Public()
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('store/:identifier')
  resolveStore(@Param('identifier') identifier: string) {
    return this.storefrontService.resolveStore(identifier);
  }

  @Get('store/:storeSlug/page/:pageSlug')
  getPage(
    @Param('storeSlug') storeSlug: string,
    @Param('pageSlug') pageSlug: string,
  ) {
    return this.storefrontService.getPage(storeSlug, pageSlug);
  }

  @Get('templates')
  getTemplates() {
    return this.storefrontService.getTemplates();
  }
}
