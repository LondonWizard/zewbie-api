import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser, CurrentUserRole } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateOrderSchema, UpdateOrderStatusSchema } from './dto/order.dto';
import type { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { PaginationSchema } from '../common/dto/pagination.dto';
import type { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateOrderSchema)) body: CreateOrderDto,
  ) {
    return this.ordersService.create(body);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @CurrentUserRole() userRole: string,
  ) {
    return this.ordersService.findOne(id, userId, userRole);
  }

  @Get('store/:storeId')
  findByStore(
    @Param('storeId') storeId: string,
    @CurrentUser() userId: string,
    @CurrentUserRole() userRole: string,
    @Query(new ZodValidationPipe(PaginationSchema)) query: PaginationDto,
  ) {
    return this.ordersService.findByStore(storeId, query, userId, userRole);
  }

  @Get('customer/:email')
  findByCustomer(
    @Param('email') email: string,
    @CurrentUser() userId: string,
    @CurrentUserRole() userRole: string,
    @Query(new ZodValidationPipe(PaginationSchema)) query: PaginationDto,
  ) {
    return this.ordersService.findByCustomer(email, query, userId, userRole);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @CurrentUserRole() userRole: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, body, userId, userRole);
  }
}
