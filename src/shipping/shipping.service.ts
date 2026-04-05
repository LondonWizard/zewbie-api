import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private prisma: PrismaService) {}

  /** Calculates shipping rates for an order (mock rates for now). */
  async getRates(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId,
      rates: [
        { carrier: 'USPS', service: 'Priority', price: 12.99, estimatedDays: '2-3' },
        { carrier: 'UPS', service: 'Ground', price: 9.99, estimatedDays: '3-5' },
        { carrier: 'FedEx', service: 'Express', price: 24.99, estimatedDays: '1-2' },
      ],
    };
  }

  /**
   * Updates tracking number on an order and marks it shipped.
   * Verifies the caller owns the order's store.
   */
  async addTracking(orderId: string, carrier: string, trackingNumber: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { userId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.store.userId !== userId) {
      throw new ForbiddenException('Not authorized to update tracking for this order');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        status: 'SHIPPED',
      },
    });

    this.logger.log(`Tracking added: ${trackingNumber} (${carrier}) for order ${orderId}`);
    return {
      orderId: updated.id,
      trackingNumber,
      carrier,
      trackingUrl: this.getTrackingUrl(carrier, trackingNumber),
    };
  }

  /** Fetches tracking info for an order. */
  async getTracking(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, trackingNumber: true, status: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.trackingNumber) throw new NotFoundException('No tracking info available');

    return {
      orderId: order.id,
      trackingNumber: order.trackingNumber,
      status: order.status,
    };
  }

  /** Builds a tracking URL from carrier and number. */
  private getTrackingUrl(carrier: string, trackingNumber: string): string {
    const urls: Record<string, string> = {
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    };
    return urls[carrier] ?? '';
  }
}
