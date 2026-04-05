import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import {
  PaginationDto,
  buildPaginationArgs,
  paginatedResponse,
} from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /** Retrieves a user by internal ID with their retailer profile if present. */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { retailerProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  /** Retrieves a user by their Clerk external ID. */
  async findByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { retailerProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  /** Updates a user's profile fields. */
  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return this.sanitize(updated);
  }

  /** Soft-deletes a user by setting status to BANNED and anonymising PII. */
  async softDelete(id: string) {
    await this.findById(id);
    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'BANNED',
        email: `deleted-${id}@zewbie.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        avatarUrl: null,
      },
    });
    return { message: 'Account deactivated' };
  }

  /** Fetches paginated notifications for a user. */
  async getNotifications(userId: string, pagination: PaginationDto) {
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        ...buildPaginationArgs(pagination),
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginatedResponse(items, total, pagination);
  }

  /** Updates a user's notification settings stored in metadata JSON. */
  async updateNotificationSettings(userId: string, settings: Record<string, boolean>) {
    const user = await this.findById(userId);
    const metadata = (user.metadata as Record<string, unknown>) ?? {};
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        metadata: { ...metadata, notificationSettings: settings },
      },
    });
    return this.sanitize(updated);
  }

  /** Fetches paginated audit log entries for a user. */
  async getActivity(userId: string, pagination: PaginationDto) {
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginatedResponse(items, total, pagination);
  }

  /** Lists all users with pagination (admin endpoint). */
  async findAll(pagination: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
        include: { retailerProfile: true },
      }),
      this.prisma.user.count(),
    ]);
    return paginatedResponse(items.map((u) => this.sanitize(u)), total, pagination);
  }

  /** Strips password hash from user objects before returning. */
  private sanitize<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
