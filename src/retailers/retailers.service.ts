import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import {
  UpdateRetailerProfileDto,
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
} from './dto/retailer.dto';
import {
  PaginationDto,
  buildPaginationArgs,
  paginatedResponse,
} from '../common/dto/pagination.dto';

@Injectable()
export class RetailersService {
  private readonly logger = new Logger(RetailersService.name);

  constructor(private prisma: PrismaService) {}

  /** Returns the retailer profile for the given user ID. */
  async getProfile(userId: string) {
    const profile = await this.prisma.retailerProfile.findUnique({
      where: { userId },
      include: {
        capabilities: true,
        locations: true,
      },
    });
    if (!profile) throw new NotFoundException('Retailer profile not found');
    return profile;
  }

  /** Updates the retailer's business profile. */
  async updateProfile(userId: string, dto: UpdateRetailerProfileDto) {
    const profile = await this.getProfile(userId);
    const { address, ...rest } = dto;
    const data: Prisma.RetailerProfileUpdateInput = { ...rest };
    if (address !== undefined) {
      data.address = address as Prisma.InputJsonValue;
    }
    return this.prisma.retailerProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  /** Lists products owned by this retailer with pagination. */
  async listProducts(userId: string, pagination: PaginationDto) {
    const profile = await this.getProfile(userId);
    const where = { retailerId: profile.id };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...buildPaginationArgs(pagination),
        include: { variants: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  /** Creates a new product under this retailer. */
  async createProduct(userId: string, dto: CreateProductDto) {
    const profile = await this.getProfile(userId);

    const existingSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new ConflictException('Product slug already taken');

    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) throw new ConflictException('SKU already exists');

    const product = await this.prisma.product.create({
      data: {
        retailerId: profile.id,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        sku: dto.sku,
        basePrice: dto.basePrice,
        category: dto.category,
        images: dto.images,
        weight: dto.weight,
        dimensions: dto.dimensions as Prisma.InputJsonValue | undefined,
        isMadeToOrder: dto.isMadeToOrder,
        slaBusinessDays: dto.slaBusinessDays,
        status: 'DRAFT',
      },
    });

    this.logger.log(`Product created: ${product.id} by retailer ${profile.id}`);
    return product;
  }

  /** Updates a product owned by this retailer. */
  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const profile = await this.getProfile(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.retailerId !== profile.id) throw new ForbiddenException('Not your product');

    const { dimensions, ...rest } = dto;
    const data: Prisma.ProductUpdateInput = { ...rest };
    if (dimensions !== undefined) {
      data.dimensions = dimensions as Prisma.InputJsonValue;
    }
    return this.prisma.product.update({ where: { id: productId }, data });
  }

  /** Adds a variant to a product. */
  async createVariant(userId: string, productId: string, dto: CreateVariantDto) {
    const profile = await this.getProfile(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.retailerId !== profile.id) throw new ForbiddenException('Not your product');

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku: dto.sku,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        stock: dto.stock,
        images: dto.images,
        attributes: dto.attributes as Prisma.InputJsonValue,
      },
    });
  }

  /** Returns retailer dashboard stats (orders, revenue, etc.). */
  async getDashboard(userId: string) {
    const profile = await this.getProfile(userId);
    const [productCount, pendingOrders] = await Promise.all([
      this.prisma.product.count({ where: { retailerId: profile.id } }),
      this.prisma.subOrder.count({
        where: { retailerId: profile.id, status: 'PENDING' },
      }),
    ]);

    return {
      businessName: profile.businessName,
      status: profile.status,
      tier: profile.tier,
      qualityScore: profile.qualityScore,
      totalOrders: profile.totalOrders,
      totalRevenue: profile.totalRevenue,
      productCount,
      pendingOrders,
    };
  }
}
