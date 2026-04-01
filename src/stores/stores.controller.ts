import { Controller, Get, Post, Put, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StoresService } from './stores.service';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create() {
    return { message: 'POST /stores - placeholder', status: 'not_implemented' };
  }

  @Get('mine')
  getMine() {
    return { message: 'GET /stores/mine - placeholder', status: 'not_implemented' };
  }

  @Put(':id')
  update(@Param('id') id: string) {
    return { message: `PUT /stores/${id} - placeholder`, status: 'not_implemented' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { message: `DELETE /stores/${id} - placeholder`, status: 'not_implemented' };
  }

  @Get(':id/pages')
  getPages(@Param('id') id: string) {
    return { message: `GET /stores/${id}/pages - placeholder`, status: 'not_implemented' };
  }

  @Post(':id/pages')
  createPage(@Param('id') id: string) {
    return { message: `POST /stores/${id}/pages - placeholder`, status: 'not_implemented' };
  }

  @Get(':id/pages/:pageId')
  getPage(@Param('id') id: string, @Param('pageId') pageId: string) {
    return { message: `GET /stores/${id}/pages/${pageId} - placeholder`, status: 'not_implemented' };
  }

  @Put(':id/pages/:pageId')
  updatePage(@Param('id') id: string, @Param('pageId') pageId: string) {
    return { message: `PUT /stores/${id}/pages/${pageId} - placeholder`, status: 'not_implemented' };
  }

  @Delete(':id/pages/:pageId')
  removePage(@Param('id') id: string, @Param('pageId') pageId: string) {
    return { message: `DELETE /stores/${id}/pages/${pageId} - placeholder`, status: 'not_implemented' };
  }

  @Put(':id/theme')
  updateTheme(@Param('id') id: string) {
    return { message: `PUT /stores/${id}/theme - placeholder`, status: 'not_implemented' };
  }

  @Put(':id/navigation')
  updateNavigation(@Param('id') id: string) {
    return { message: `PUT /stores/${id}/navigation - placeholder`, status: 'not_implemented' };
  }

  @Put(':id/domain')
  updateDomain(@Param('id') id: string) {
    return { message: `PUT /stores/${id}/domain - placeholder`, status: 'not_implemented' };
  }

  @Get(':id/domain/verify')
  verifyDomain(@Param('id') id: string) {
    return { message: `GET /stores/${id}/domain/verify - placeholder`, status: 'not_implemented' };
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return { message: `POST /stores/${id}/publish - placeholder`, status: 'not_implemented' };
  }

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return { message: `GET /stores/${id}/preview - placeholder`, status: 'not_implemented' };
  }
}
