import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { StorefrontModule } from './storefront/storefront.module';
import { CatalogModule } from './catalog/catalog.module';
import { RetailersModule } from './retailers/retailers.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ShippingModule } from './shipping/shipping.module';
import { MediaModule } from './media/media.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StoresModule,
    StorefrontModule,
    CatalogModule,
    RetailersModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    MediaModule,
    IntegrationsModule,
    AnalyticsModule,
    AdminModule,
    NotificationsModule,
    WebhooksModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
