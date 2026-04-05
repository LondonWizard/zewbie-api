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
  CreateStoreDto,
  UpdateStoreDto,
  UpdateThemeDto,
  UpdateDomainDto,
  CreatePageDto,
  UpdatePageDto,
} from './dto/store.dto';

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(private prisma: PrismaService) {}

  /** Creates a new store, checking slug uniqueness. */
  async create(userId: string, dto: CreateStoreDto) {
    const existingSlug = await this.prisma.store.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) throw new ConflictException('Store slug already taken');

    const store = await this.prisma.store.create({
      data: {
        userId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        templateId: dto.templateId,
        status: 'DRAFT',
      },
    });

    this.logger.log(`Store created: ${store.id} by user ${userId}`);
    return store;
  }

  /** Returns all stores owned by the user. */
  async findMine(userId: string) {
    return this.prisma.store.findMany({
      where: { userId },
      include: { pages: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Fetches a store by ID, ensuring the requester owns it. */
  async findOneOwned(storeId: string, userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { pages: true, versions: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    if (store.userId !== userId) throw new ForbiddenException('Not your store');
    return store;
  }

  /** Updates store fields. */
  async update(storeId: string, userId: string, dto: UpdateStoreDto) {
    await this.findOneOwned(storeId, userId);
    const { seoMetadata, ...rest } = dto;
    const data: Prisma.StoreUpdateInput = { ...rest };
    if (seoMetadata !== undefined) {
      data.seoMetadata = seoMetadata as Prisma.InputJsonValue;
    }
    return this.prisma.store.update({ where: { id: storeId }, data });
  }

  /** Deletes a store (only if in DRAFT status). */
  async remove(storeId: string, userId: string) {
    const store = await this.findOneOwned(storeId, userId);
    if (store.status !== 'DRAFT') {
      throw new ForbiddenException('Only draft stores can be deleted');
    }
    await this.prisma.store.delete({ where: { id: storeId } });
    return { message: 'Store deleted' };
  }

  /** Updates store theme configuration. */
  async updateTheme(storeId: string, userId: string, dto: UpdateThemeDto) {
    await this.findOneOwned(storeId, userId);
    return this.prisma.store.update({
      where: { id: storeId },
      data: { themeConfig: dto.themeConfig as Prisma.InputJsonValue },
    });
  }

  /** Sets a custom domain for the store. */
  async updateDomain(storeId: string, userId: string, dto: UpdateDomainDto) {
    await this.findOneOwned(storeId, userId);
    const domainTaken = await this.prisma.store.findUnique({
      where: { domain: dto.domain },
    });
    if (domainTaken && domainTaken.id !== storeId) {
      throw new ConflictException('Domain already in use');
    }
    return this.prisma.store.update({
      where: { id: storeId },
      data: { domain: dto.domain },
    });
  }

  /**
   * Publishes a store by setting status to PUBLISHED and snapshotting a version.
   * Uses an interactive transaction to prevent version numbering race conditions.
   */
  async publish(storeId: string, userId: string) {
    const store = await this.findOneOwned(storeId, userId);

    return this.prisma.$transaction(async (tx) => {
      const latestVersion = await tx.storeVersion.findFirst({
        where: { storeId },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latestVersion?.version ?? 0) + 1;

      await tx.store.update({
        where: { id: storeId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });

      await tx.storeVersion.create({
        data: {
          storeId,
          version: nextVersion,
          content: {
            name: store.name,
            themeConfig: store.themeConfig,
            seoMetadata: store.seoMetadata,
          },
        },
      });

      return { message: 'Store published', version: nextVersion };
    });
  }

  // ── Page CRUD ───────────────────────────────────────────────────────────────

  /** Creates a page within a store. */
  async createPage(storeId: string, userId: string, dto: CreatePageDto) {
    await this.findOneOwned(storeId, userId);
    return this.prisma.storePage.create({
      data: {
        storeId,
        title: dto.title,
        slug: dto.slug,
        content: dto.content as Prisma.InputJsonValue,
        pageType: dto.pageType,
        sortOrder: dto.sortOrder,
      },
    });
  }

  /** Lists all pages for a store. */
  async getPages(storeId: string, userId: string) {
    await this.findOneOwned(storeId, userId);
    return this.prisma.storePage.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Fetches a single page by ID. */
  async getPage(storeId: string, pageId: string, userId: string) {
    await this.findOneOwned(storeId, userId);
    const page = await this.prisma.storePage.findUnique({
      where: { id: pageId },
    });
    if (!page || page.storeId !== storeId) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  /** Updates a page within a store. */
  async updatePage(storeId: string, pageId: string, userId: string, dto: UpdatePageDto) {
    await this.getPage(storeId, pageId, userId);
    const { content, ...rest } = dto;
    const data: Prisma.StorePageUpdateInput = { ...rest };
    if (content !== undefined) {
      data.content = content as Prisma.InputJsonValue;
    }
    return this.prisma.storePage.update({ where: { id: pageId }, data });
  }

  /** Deletes a page from a store. */
  async removePage(storeId: string, pageId: string, userId: string) {
    await this.getPage(storeId, pageId, userId);
    await this.prisma.storePage.delete({ where: { id: pageId } });
    return { message: 'Page deleted' };
  }

  // ── Page Version History ──────────────────────────────────────────────────

  /** Returns all store-level version snapshots for version history display. */
  async getPageVersions(storeId: string, userId: string) {
    await this.findOneOwned(storeId, userId);
    return this.prisma.storeVersion.findMany({
      where: { storeId },
      orderBy: { version: 'desc' },
      take: 50,
    });
  }

  /**
   * Restores a store to a specific version's content snapshot.
   * Applies the version's stored name, themeConfig, and seoMetadata to the store.
   */
  async restoreVersion(storeId: string, versionId: string, userId: string) {
    await this.findOneOwned(storeId, userId);
    const version = await this.prisma.storeVersion.findUnique({
      where: { id: versionId },
    });
    if (!version || version.storeId !== storeId) {
      throw new NotFoundException('Version not found');
    }

    const content = version.content as {
      name?: string;
      themeConfig?: Prisma.InputJsonValue;
      seoMetadata?: Prisma.InputJsonValue;
    };

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...(content.name !== undefined && { name: content.name }),
        ...(content.themeConfig !== undefined && { themeConfig: content.themeConfig }),
        ...(content.seoMetadata !== undefined && { seoMetadata: content.seoMetadata }),
      },
    });
  }
}
