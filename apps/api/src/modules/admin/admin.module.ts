import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CategoriesController } from "../categories/categories.controller";
import { CategoriesService } from "../categories/categories.service";
import { OrdersModule } from "../orders/orders.module";
import { AdminProductsController } from "../products/product.controllers";
import { ProductsService } from "../products/product.service";
import { AdminController } from "./admin.controller";
import { FailedWebhooksAdminController } from "./failed-webhooks.controller";

@Module({
  imports: [AuthModule, OrdersModule],
  controllers: [
    AdminController,
    CategoriesController,
    AdminProductsController,
    FailedWebhooksAdminController,
  ],
  providers: [CategoriesService, ProductsService],
})
export class AdminModule {}
