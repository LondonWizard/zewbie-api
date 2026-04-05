import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchProductsDto } from './dto/catalog.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  /** Search/filter products in the public catalog (only ACTIVE products). */
  async search(dto: SearchProductsDto) {
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      ...(dto.q && {
        OR: [
          { name: { contains: dto.q, mode: 'insensitive' } },
          { description: { contains: dto.q, mode: 'insensitive' } },
        ],
      }),
      ...(dto.category && { category: dto.category }),
      ...(dto.minPrice !== undefined || dto.maxPrice !== undefined
        ? {
            basePrice: {
              ...(dto.minPrice !== undefined && { gte: dto.minPrice }),
              ...(dto.maxPrice !== undefined && { lte: dto.maxPrice }),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      dto.sortBy === 'price'
        ? { basePrice: dto.sortOrder }
        : dto.sortBy === 'name'
          ? { name: dto.sortOrder }
          : { createdAt: dto.sortOrder };

    const skip = (dto.page - 1) * dto.limit;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: dto.limit,
        include: {
          variants: { where: { isActive: true } },
          diamondAttributes: true,
          retailer: { select: { businessName: true, tier: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginatedResponse(items, total, {
      page: dto.page,
      limit: dto.limit,
      sortOrder: dto.sortOrder,
    });
  }

  /** Fetches a single product with all details. */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        diamondAttributes: true,
        retailer: { select: { businessName: true, tier: true, qualityScore: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** Fetches a product by its URL slug. */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        diamondAttributes: true,
        retailer: { select: { businessName: true, tier: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** Lists featured products (top-rated retailers, most recent). */
  async getFeatured(limit: number = 12) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        retailer: { tier: { in: ['GOLD', 'PLATINUM'] } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: { where: { isActive: true }, take: 1 },
        retailer: { select: { businessName: true, tier: true } },
      },
    });
  }

  /** Returns distinct product categories with counts. */
  async getCategories() {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE', category: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return categories.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));
  }
}
