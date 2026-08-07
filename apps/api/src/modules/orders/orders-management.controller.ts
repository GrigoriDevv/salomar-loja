import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { Roles } from "../auth/roles.decorators";
import { RolesGuard } from "../auth/roles.guard";
import { ListOrdersDto } from "./dto/list-orders.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrdersManagementService } from "./orders-management.service";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("atendente", "admin")
export class OrdersManagementController {
  constructor(private readonly orders: OrdersManagementService) {}

  @Get()
  list(@Query() query: ListOrdersDto) {
    return this.orders.list(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orders.findOne(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.updateStatus(id, dto, user);
  }
}
