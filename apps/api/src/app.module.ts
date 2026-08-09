import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { isSentryEnabled } from './instrument'
import { AccountModule } from './modules/account/account.module'
import { AdminModule } from './modules/admin/admin.module'
import { AuthModule } from './modules/auth/auth.module'
import { CartModule } from './modules/cart/cart.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { ConsentModule } from './modules/consent/consent.module'
import { HealthModule } from './modules/health/health.module'
import { OrdersModule } from './modules/orders/orders.module'
import { RetentionModule } from './modules/retention/retention.module'
import { ShippingModule } from './modules/shipping/shipping.module'
import { PrismaModule } from './prisma/prisma.module'

const sentryOn = isSentryEnabled()

// Load Sentry Nest wiring only when enabled — static import crashes Vercel cold start.
const sentrySetup = sentryOn
  ? (require('@sentry/nestjs/setup') as typeof import('@sentry/nestjs/setup'))
  : null
const SentryDebugController = sentryOn
  ? (
      require('./modules/observability/sentry-debug.controller') as typeof import('./modules/observability/sentry-debug.controller')
    ).SentryDebugController
  : null

@Module({
  imports: [
    ...(sentryOn && sentrySetup ? [sentrySetup.SentryModule.forRoot()] : []),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    CatalogModule,
    AuthModule,
    ConsentModule,
    AccountModule,
    AdminModule,
    CartModule,
    OrdersModule,
    ShippingModule,
    RetentionModule,
  ],
  controllers: SentryDebugController ? [SentryDebugController] : [],
  providers:
    sentryOn && sentrySetup
      ? [
          {
            provide: APP_FILTER,
            useClass: sentrySetup.SentryGlobalFilter,
          },
        ]
      : [],
})
export class AppModule {}
