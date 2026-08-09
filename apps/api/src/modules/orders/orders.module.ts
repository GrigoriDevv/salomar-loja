import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ShippingModule } from "../shipping/shipping.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { MpClient } from "./mp.client";
import { OrdersManagementController } from "./orders-management.controller";
import { OrdersManagementService } from "./orders-management.service";
import { PaymentsQueueService } from "./payments-queue.service";
import { WebhooksController } from "./webhooks.controller";

@Module({
  imports: [AuthModule, ShippingModule],
  controllers: [
    CheckoutController,
    WebhooksController,
    OrdersManagementController,
  ],
  providers: [
    CheckoutService,
    MpClient,
    OrdersManagementService,
    PaymentsQueueService,
  ],
  exports: [CheckoutService, OrdersManagementService, PaymentsQueueService],
})
export class OrdersModule {}
