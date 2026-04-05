import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RetailersService } from './retailers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  UpdateRetailerProfileSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
} from './dto/retailer.dto';
import type {
  UpdateRetailerProfileDto,
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
} from './dto/retailer.dto';
import { PaginationSchema } from '../common/dto/pagination.dto';
import type { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Retailers')
@ApiBearerAuth()
@Controller('retailers')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles('RETAILER', 'ADMIN', 'SUPER_ADMIN')
export class RetailersController {
  constructor(private readonly retailersService: RetailersService) {}

  @Get('profile')
  getProfile(@CurrentUser() userId: string) {
    return this.retailersService.getProfile(userId);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(UpdateRetailerProfileSchema)) body: UpdateRetailerProfileDto,
  ) {
    return this.retailersService.updateProfile(userId, body);
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() userId: string) {
    return this.retailersService.getDashboard(userId);
  }

  @Get('products')
  listProducts(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(PaginationSchema)) query: PaginationDto,
  ) {
    return this.retailersService.listProducts(userId, query);
  }

  @Post('products')
  createProduct(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(CreateProductSchema)) body: CreateProductDto,
  ) {
    return this.retailersService.createProduct(userId, body);
  }

  @Put('products/:id')
  updateProduct(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) body: UpdateProductDto,
  ) {
    return this.retailersService.updateProduct(userId, id, body);
  }

  @Post('products/:id/variants')
  createVariant(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateVariantSchema)) body: CreateVariantDto,
  ) {
    return this.retailersService.createVariant(userId, id, body);
  }
}
