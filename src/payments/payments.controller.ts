import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  checkout() {
    return { message: 'POST /payments/checkout - placeholder', status: 'not_implemented' };
  }

  @Post('webhook')
  webhook() {
    return { message: 'POST /payments/webhook - placeholder', status: 'not_implemented' };
  }

  @Get('methods')
  getMethods() {
    return { message: 'GET /payments/methods - placeholder', status: 'not_implemented' };
  }

  @Post('methods')
  addMethod() {
    return { message: 'POST /payments/methods - placeholder', status: 'not_implemented' };
  }

  @Delete('methods/:id')
  removeMethod(@Param('id') id: string) {
    return { message: `DELETE /payments/methods/${id} - placeholder`, status: 'not_implemented' };
  }
}
