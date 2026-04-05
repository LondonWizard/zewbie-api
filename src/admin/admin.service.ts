import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaginationDto,
  buildPaginationArgs,
  paginatedResponse,
} from '../common/dto/pagination.dto';

/** Select clause that explicitly excludes passwordHash from User responses. */
const USER_SAFE_SELECT = {
  id: true,
  clerkId: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  phone: true,
  role: true,
  status: true,
  adminRole: true,
  emailVerified: true,
  twoFactorEnabled: true,
  onboardingCompleted: true,
  stripeAccountId: true,
  stripeCustomerId: true,
  lastLoginAt: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  /** Dashboard summary for the admin portal. */
  async getDashboard() {
    const [
      totalUsers,
      totalRetailers,
      pendingRetailers,
      totalOrders,
      totalStores,
      totalProducts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.retailerProfile.count(),
      this.prisma.retailerProfile.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count(),
      this.prisma.store.count(),
      this.prisma.product.count(),
    ]);

    return {
      totalUsers,
      totalRetailers,
      pendingRetailers,
      totalOrders,
      totalStores,
      totalProducts,
    };
  }

  /** Lists all users with filters and pagination. Excludes passwordHash. */
  async listUsers(pagination: PaginationDto, filters?: { role?: string; status?: string }) {
    const where = {
      ...(filters?.role && { role: filters.role as 'USER' | 'RETAILER' | 'ADMIN' }),
      ...(filters?.status && { status: filters.status as 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'BANNED' }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
        select: {
          ...USER_SAFE_SELECT,
          retailerProfile: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  /** Fetches a user's complete profile for admin review. Excludes passwordHash. */
  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SAFE_SELECT,
        retailerProfile: { include: { capabilities: true, locations: true } },
        stores: true,
        auditLogs: { take: 20, orderBy: { createdAt: 'desc' } },
        notifications: { take: 10, orderBy: { sentAt: 'desc' } },
        userDataRecord: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Lists pending retailer applications. */
  async listPendingRetailers(pagination: PaginationDto) {
    const where = { status: 'PENDING' as const };
    const [items, total] = await Promise.all([
      this.prisma.retailerProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
        include: { user: { select: USER_SAFE_SELECT } },
      }),
      this.prisma.retailerProfile.count({ where }),
    ]);
    return paginatedResponse(items, total, pagination);
  }

  /** Approves or rejects a retailer application. */
  async reviewRetailer(retailerId: string, decision: 'APPROVED' | 'REJECTED', actorId: string) {
    const retailer = await this.prisma.retailerProfile.findUnique({
      where: { id: retailerId },
    });
    if (!retailer) throw new NotFoundException('Retailer not found');

    const updated = await this.prisma.retailerProfile.update({
      where: { id: retailerId },
      data: { status: decision },
    });

    if (decision === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: retailer.userId },
        data: { status: 'ACTIVE' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: `RETAILER_${decision}`,
        entity: 'RetailerProfile',
        entityId: retailerId,
        metadata: { decision },
      },
    });

    this.logger.log(`Retailer ${retailerId} ${decision} by admin ${actorId}`);
    return updated;
  }

  /** Fetches paginated audit logs across the platform. */
  async getAuditLogs(pagination: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return paginatedResponse(items, total, pagination);
  }

  /** Suspends a user. */
  async suspendUser(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'USER_SUSPENDED',
        entity: 'User',
        entityId: userId,
      },
    });

    return { message: 'User suspended' };
  }
}
