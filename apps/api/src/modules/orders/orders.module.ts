import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { MpClient } from "./mp.client";
import { OrdersManagementController } from "./orders-management.controller";
import { OrdersManagementService } from "./orders-management.service";
import { WebhooksController } from "./webhooks.controller";

@Module({
  imports: [AuthModule],
  controllers: [
    CheckoutController,
    WebhooksController,
    OrdersManagementController,
  ],
  providers: [CheckoutService, MpClient, OrdersManagementService],
  exports: [CheckoutService, OrdersManagementService],
})
export class OrdersModule {}
