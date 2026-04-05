import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

/** Processes incoming webhooks from Clerk, Stripe, and other services. */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  /** Handles Clerk webhook events for user lifecycle sync. */
  async handleClerkWebhook(event: { type: string; data: Record<string, unknown> }) {
    this.logger.log(`Clerk webhook: ${event.type}`);

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const emailAddresses = event.data.email_addresses as
          | Array<{ email_address: string }>
          | undefined;
        await this.authService.syncClerkUser(
          event.data.id as string,
          {
            email: emailAddresses?.[0]?.email_address ?? '',
            firstName: (event.data.first_name as string) ?? '',
            lastName: (event.data.last_name as string) ?? '',
            imageUrl: event.data.image_url as string | undefined,
          },
        );
        break;
      }

      case 'user.deleted': {
        const clerkId = event.data.id as string;
        const user = await this.prisma.user.findUnique({ where: { clerkId } });
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              status: 'BANNED',
              email: `deleted-${user.id}@zewbie.com`,
              firstName: 'Deleted',
              lastName: 'User',
            },
          });
          this.logger.log(`User soft-deleted via Clerk webhook: ${user.id}`);
        }
        break;
      }

      case 'session.created': {
        const userId = event.data.user_id as string;
        const user = await this.prisma.user.findUnique({ where: { clerkId: userId } });
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
        break;
      }

      default:
        this.logger.warn(`Unhandled Clerk event: ${event.type}`);
    }

    return { received: true };
  }

  /** Handles Stripe webhook events (placeholder until Stripe is integrated). */
  async handleStripeWebhook(event: { type: string; data: Record<string, unknown> }) {
    this.logger.log(`Stripe webhook: ${event.type}`);
    return { received: true, message: 'Stripe webhook handling pending' };
  }
}
