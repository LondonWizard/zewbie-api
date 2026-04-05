import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Payment processing service. Currently uses mock fallbacks since Stripe
 * integration is deferred. When Stripe is connected, this will use
 * Stripe Connect Express for destination charges.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripeEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripeEnabled = !!this.config.get<string>('stripe.secretKey');
    if (!this.stripeEnabled) {
      this.logger.warn('Stripe not configured — using mock payment fallbacks');
    }
  }

  /** Creates a payment record for an order (mock for now). */
  async createPaymentIntent(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (this.stripeEnabled) {
      return { message: 'Stripe integration pending' };
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: `mock_pi_${Date.now()}`,
        amount: order.totalPrice,
        status: 'PENDING',
      },
    });

    this.logger.log(`Mock payment created: ${payment.id} for order ${orderId}`);
    return {
      paymentId: payment.id,
      clientSecret: `mock_secret_${payment.id}`,
      amount: order.totalPrice,
    };
  }

  /**
   * Confirms a payment (mock auto-completes).
   * Only PENDING payments can be confirmed — enforces payment state machine.
   */
  async confirmPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Only pending payments can be confirmed');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'ACCEPTED' },
    });

    this.logger.log(`Payment confirmed: ${paymentId}`);
    return updated;
  }

  /**
   * Processes a refund for a payment (mock).
   * Only COMPLETED payments can be refunded — enforces payment state machine.
   * Also updates the associated order status to REFUNDED.
   */
  async refund(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'REFUNDED' },
    });

    this.logger.log(`Refund processed: ${paymentId}`);
    return updated;
  }

  /** Fetches payment details by order ID. */
  async findByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
