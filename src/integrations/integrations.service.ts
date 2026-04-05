import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Manages social integrations (IG, TikTok, FB, Pinterest, YouTube). */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private prisma: PrismaService) {}

  /** Lists social integrations for a user's stores. */
  async listForUser(userId: string) {
    return this.prisma.socialIntegration.findMany({
      where: { userId },
      include: { store: { select: { name: true, slug: true } } },
    });
  }

  /**
   * Connects a social platform to a store (placeholder for OAuth flow).
   * Verifies the store belongs to the requesting user.
   */
  async connect(
    userId: string,
    storeId: string,
    platform: string,
    accessToken: string,
  ) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { userId: true },
    });
    if (!store || store.userId !== userId) {
      throw new ForbiddenException('Not authorized to connect integrations for this store');
    }

    const integration = await this.prisma.socialIntegration.create({
      data: {
        userId,
        storeId,
        platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK' | 'PINTEREST' | 'YOUTUBE',
        accessToken,
        catalogSyncEnabled: false,
      },
    });

    this.logger.log(`Social integration connected: ${platform} for store ${storeId}`);
    return integration;
  }

  /**
   * Disconnects a social integration by deleting the record.
   * Verifies the integration belongs to the requesting user.
   */
  async disconnect(integrationId: string, userId: string) {
    const integration = await this.prisma.socialIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) throw new NotFoundException('Integration not found');
    if (integration.userId !== userId) {
      throw new ForbiddenException('Not authorized to disconnect this integration');
    }

    await this.prisma.socialIntegration.delete({
      where: { id: integrationId },
    });
    return { message: 'Integration disconnected' };
  }
}
