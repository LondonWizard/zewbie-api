import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Public-facing storefront queries — no auth required. */
@Injectable()
export class StorefrontService {
  constructor(private prisma: PrismaService) {}

  /** Resolves a store by slug or custom domain for the public storefront. */
  async resolveStore(identifier: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [{ slug: identifier }, { domain: identifier }],
      },
      include: {
        pages: { where: { isPublished: true }, orderBy: { sortOrder: 'asc' } },
        storeProducts: {
          include: {
            product: {
              include: {
                variants: { where: { isActive: true } },
              },
            },
          },
        },
      },
    });

    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  /** Fetches a published store page by store slug and page slug. */
  async getPage(storeSlug: string, pageSlug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug: storeSlug },
    });
    if (!store) throw new NotFoundException('Store not found');

    const page = await this.prisma.storePage.findFirst({
      where: { storeId: store.id, slug: pageSlug, isPublished: true },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  /** Lists available store templates for new store creation. */
  async getTemplates() {
    return this.prisma.storeTemplate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
