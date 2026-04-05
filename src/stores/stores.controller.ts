import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateStoreSchema,
  UpdateStoreSchema,
  UpdateThemeSchema,
  UpdateDomainSchema,
  CreatePageSchema,
  UpdatePageSchema,
} from './dto/store.dto';
import type {
  CreateStoreDto,
  UpdateStoreDto,
  UpdateThemeDto,
  UpdateDomainDto,
  CreatePageDto,
  UpdatePageDto,
} from './dto/store.dto';

@ApiTags('Stores')
@ApiBearerAuth()
@Controller('stores')
@UseGuards(ClerkAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(CreateStoreSchema)) body: CreateStoreDto,
  ) {
    return this.storesService.create(userId, body);
  }

  @Get('mine')
  getMine(@CurrentUser() userId: string) {
    return this.storesService.findMine(userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(UpdateStoreSchema)) body: UpdateStoreDto,
  ) {
    return this.storesService.update(id, userId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.storesService.remove(id, userId);
  }

  @Put(':id/theme')
  updateTheme(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(UpdateThemeSchema)) body: UpdateThemeDto,
  ) {
    return this.storesService.updateTheme(id, userId, body);
  }

  @Put(':id/domain')
  updateDomain(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(UpdateDomainSchema)) body: UpdateDomainDto,
  ) {
    return this.storesService.updateDomain(id, userId, body);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.storesService.publish(id, userId);
  }

  @Get(':id/preview')
  preview(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.storesService.findOneOwned(id, userId);
  }

  // ── Pages ─────────────────────────────────────────────────────────────────

  @Get(':id/pages')
  getPages(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.storesService.getPages(id, userId);
  }

  @Post(':id/pages')
  createPage(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(CreatePageSchema)) body: CreatePageDto,
  ) {
    return this.storesService.createPage(id, userId, body);
  }

  @Get(':id/pages/:pageId')
  getPage(
    @Param('id') id: string,
    @Param('pageId') pageId: string,
    @CurrentUser() userId: string,
  ) {
    return this.storesService.getPage(id, pageId, userId);
  }

  @Put(':id/pages/:pageId')
  updatePage(
    @Param('id') id: string,
    @Param('pageId') pageId: string,
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(UpdatePageSchema)) body: UpdatePageDto,
  ) {
    return this.storesService.updatePage(id, pageId, userId, body);
  }

  @Delete(':id/pages/:pageId')
  removePage(
    @Param('id') id: string,
    @Param('pageId') pageId: string,
    @CurrentUser() userId: string,
  ) {
    return this.storesService.removePage(id, pageId, userId);
  }

  // ── Version History ─────────────────────────────────────────────────────

  @Get(':id/versions')
  getVersions(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.storesService.getPageVersions(id, userId);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
  ) {
    return this.storesService.restoreVersion(id, versionId, userId);
  }
}
