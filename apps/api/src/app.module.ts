import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup'
import { AccountModule } from './modules/account/account.module'
import { AdminModule } from './modules/admin/admin.module'
import { AuthModule } from './modules/auth/auth.module'
import { CartModule } from './modules/cart/cart.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { HealthModule } from './modules/health/health.module'
import { SentryDebugController } from './modules/observability/sentry-debug.controller'
import { OrdersModule } from './modules/orders/orders.module'
import { RetentionModule } from './modules/retention/retention.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    CatalogModule,
    AuthModule,
    AccountModule,
    AdminModule,
    CartModule,
    OrdersModule,
    RetentionModule,
  ],
  controllers: [SentryDebugController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
