import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { Roles } from "../auth/roles.decorators";
import { RolesGuard } from "../auth/roles.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./product.service";

@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list() {
    return this.products.findAll();
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.products.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}
