import { Controller, Post, Body, Headers, Logger, BadRequestException, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { WebhooksService } from './webhooks.service';
import { Public } from '../common/decorators/public.decorator';
import * as express from 'express';

@ApiTags('Webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  private readonly clerkWebhookSecret: string | undefined;

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {
    this.clerkWebhookSecret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
  }

  @Post('clerk')
  handleClerk(
    @Req() req: express.Request,
    @Body() body: { type: string; data: Record<string, unknown> },
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    if (this.clerkWebhookSecret) {
      const wh = new Webhook(this.clerkWebhookSecret);
      try {
        wh.verify(JSON.stringify(body), {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch {
        this.logger.warn('Clerk webhook signature verification failed');
        throw new BadRequestException('Invalid webhook signature');
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Webhook secret not configured');
    }

    this.logger.log(`Clerk webhook received: ${body.type}`);
    return this.webhooksService.handleClerkWebhook(body);
  }

  @Post('stripe')
  handleStripe(
    @Body() body: { type: string; data: Record<string, unknown> },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Missing Stripe signature');
    }
    this.logger.log(`Stripe webhook received: ${body.type}`);
    return this.webhooksService.handleStripeWebhook(body);
  }
}
