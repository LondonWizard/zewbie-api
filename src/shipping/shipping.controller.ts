import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AddTrackingSchema } from './dto/shipping.dto';
import type { AddTrackingDto } from './dto/shipping.dto';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('rates/:orderId')
  getRates(@Param('orderId') orderId: string) {
    return this.shippingService.getRates(orderId);
  }

  @Post('tracking')
  addTracking(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(AddTrackingSchema)) body: AddTrackingDto,
  ) {
    return this.shippingService.addTracking(
      body.orderId,
      body.carrier,
      body.trackingNumber,
      userId,
    );
  }

  @Get('tracking/:orderId')
  getTracking(@Param('orderId') orderId: string) {
    return this.shippingService.getTracking(orderId);
  }
}
