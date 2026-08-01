import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CategoriesController } from "../categories/categories.controller";
import { CategoriesService } from "../categories/categories.service";
import { AdminController } from "./admin.controller";
import { AdminProductsController } from "../products/product.controllers";
import { ProductsService } from "../products/product.service";

@Module({
  imports: [AuthModule],
  controllers: [
    AdminController,
    CategoriesController,
    AdminProductsController,
  ],
  providers: [CategoriesService, ProductsService],
})
export class AdminModule {}
