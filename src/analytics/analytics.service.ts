import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches aggregated analytics for a store within a date range.
   * Uses Prisma aggregate for totals instead of JS reduce.
   * Enforces IDOR: caller must own the store or be an admin.
   */
  async getStoreAnalytics(
    storeId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userRole: string,
  ) {
    if (!ADMIN_ROLES.includes(userRole)) {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { userId: true },
      });
      if (!store || store.userId !== userId) {
        throw new ForbiddenException('Not authorized to view analytics for this store');
      }
    }

    const where = { storeId, date: { gte: startDate, lte: endDate } };

    const [aggregation, daily] = await Promise.all([
      this.prisma.storeAnalytics.aggregate({
        where,
        _sum: {
          pageViews: true,
          uniqueVisitors: true,
          productViews: true,
          addToCarts: true,
          checkouts: true,
          orders: true,
          revenue: true,
        },
      }),
      this.prisma.storeAnalytics.findMany({
        where,
        orderBy: { date: 'asc' },
      }),
    ]);

    const totals = {
      pageViews: aggregation._sum.pageViews ?? 0,
      uniqueVisitors: aggregation._sum.uniqueVisitors ?? 0,
      productViews: aggregation._sum.productViews ?? 0,
      addToCarts: aggregation._sum.addToCarts ?? 0,
      checkouts: aggregation._sum.checkouts ?? 0,
      orders: aggregation._sum.orders ?? 0,
      revenue: Number(aggregation._sum.revenue ?? 0),
    };

    return { period: { startDate, endDate }, totals, daily };
  }

  /** Returns platform-wide analytics summary for admin. */
  async getPlatformSummary() {
    const [totalOrders, totalUsers, totalStores] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.store.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return { totalOrders, totalUsers, totalStores };
  }
}
