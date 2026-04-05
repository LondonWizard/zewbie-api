import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(ClerkAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent/:orderId')
  createPaymentIntent(@Param('orderId') orderId: string) {
    return this.paymentsService.createPaymentIntent(orderId);
  }

  @Post(':id/confirm')
  confirmPayment(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @Post(':id/refund')
  refund(@Param('id') id: string) {
    return this.paymentsService.refund(id);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }
}
