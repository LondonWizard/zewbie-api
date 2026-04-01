import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rates')
  getRates() {
    return { message: 'POST /shipping/rates - placeholder', status: 'not_implemented' };
  }

  @Post('labels')
  createLabel() {
    return { message: 'POST /shipping/labels - placeholder', status: 'not_implemented' };
  }

  @Get('tracking/:trackingNumber')
  getTracking(@Param('trackingNumber') trackingNumber: string) {
    return { message: `GET /shipping/tracking/${trackingNumber} - placeholder`, status: 'not_implemented' };
  }

  @Get('carriers')
  getCarriers() {
    return { message: 'GET /shipping/carriers - placeholder', status: 'not_implemented' };
  }
}
