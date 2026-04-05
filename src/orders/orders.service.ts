import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import {
  PaginationDto,
  buildPaginationArgs,
  paginatedResponse,
} from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new order for a given store product.
   * Validates storeProduct ownership, product status, and stock availability.
   * Calculates pricing splits: 10% platform fee, commissions.
   * Decrements stock atomically within a transaction.
   */
  async create(dto: CreateOrderDto) {
    const storeProduct = await this.prisma.storeProduct.findUnique({
      where: { id: dto.storeProductId },
      include: { product: true },
    });
    if (!storeProduct) throw new BadRequestException('Store product not found');

    if (storeProduct.storeId !== dto.storeId) {
      throw new BadRequestException('Store product does not belong to the specified store');
    }
    if (storeProduct.product.status !== 'ACTIVE') {
      throw new BadRequestException('Product is not available for purchase');
    }
    if (storeProduct.product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const unitPrice = storeProduct.product.basePrice.add(storeProduct.markup);
    const totalPrice = unitPrice.mul(dto.quantity);
    const platformFee = totalPrice.mul(0.10);
    const taxAmount = totalPrice.mul(0.08);
    const subtotal = totalPrice;
    const markupTotal = storeProduct.markup.mul(dto.quantity);
    const userCommission = markupTotal.mul(0.50);
    const zewbieCommission = markupTotal.mul(0.50);

    const order = await this.prisma.$transaction(async (tx) => {
      const stockResult = await tx.product.updateMany({
        where: { id: storeProduct.productId, stock: { gte: dto.quantity } },
        data: { stock: { decrement: dto.quantity } },
      });
      if (stockResult.count === 0) {
        throw new BadRequestException('Insufficient stock');
      }

      return tx.order.create({
        data: {
          storeId: dto.storeId,
          storeProductId: dto.storeProductId,
          quantity: dto.quantity,
          totalPrice,
          subtotal,
          taxAmount,
          shippingAmount: new Prisma.Decimal(0),
          platformFee,
          userCommission,
          zewbieCommission,
          customerEmail: dto.customerEmail,
          customerName: dto.customerName,
          shippingAddress: dto.shippingAddress as Prisma.InputJsonValue,
          billingAddress: (dto.billingAddress ?? dto.shippingAddress) as Prisma.InputJsonValue,
          notes: dto.notes,
          status: 'PENDING',
        },
        include: { subOrders: true },
      });
    });

    this.logger.log(`Order created: ${order.id}, total: $${totalPrice.toString()}`);
    return order;
  }

  /**
   * Fetches an order by ID with all related data.
   * Enforces IDOR: caller must own the order's store, match customerEmail, or be an admin.
   */
  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        store: { select: { userId: true } },
        subOrders: { include: { retailer: { select: { businessName: true } } } },
        payments: true,
        dispute: true,
        returnRequest: true,
        invoice: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!ADMIN_ROLES.includes(userRole)) {
      const userOwnsStore = order.store.userId === userId;
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const emailMatches = user?.email === order.customerEmail;

      if (!userOwnsStore && !emailMatches) {
        throw new ForbiddenException('Not authorized to view this order');
      }
    }

    return order;
  }

  /**
   * Lists orders for a store with pagination.
   * Enforces IDOR: caller must own the store or be an admin.
   */
  async findByStore(storeId: string, pagination: PaginationDto, userId: string, userRole: string) {
    if (!ADMIN_ROLES.includes(userRole)) {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { userId: true },
      });
      if (!store || store.userId !== userId) {
        throw new ForbiddenException('Not authorized to view orders for this store');
      }
    }

    const where = { storeId };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
        include: { subOrders: true },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginatedResponse(items, total, pagination);
  }

  /**
   * Lists orders placed by a customer email with pagination.
   * Enforces IDOR: email must match current user's email or caller must be an admin.
   */
  async findByCustomer(customerEmail: string, pagination: PaginationDto, userId: string, userRole: string) {
    if (!ADMIN_ROLES.includes(userRole)) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (!user || user.email !== customerEmail) {
        throw new ForbiddenException('Not authorized to view orders for this customer');
      }
    }

    const where = { customerEmail };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginatedResponse(items, total, pagination);
  }

  /**
   * Updates the status of an order (with audit trail).
   * Enforces IDOR: caller must own the order's store or be an admin.
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { store: { select: { userId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!ADMIN_ROLES.includes(userRole) && order.store.userId !== actorId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'ORDER_STATUS_CHANGE',
        entity: 'Order',
        entityId: id,
        metadata: {
          from: order.status,
          to: dto.status,
          note: dto.note,
        },
      },
    });

    this.logger.log(`Order ${id} status: ${order.status} -> ${dto.status}`);
    return updated;
  }
}
