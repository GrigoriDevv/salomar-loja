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
import type { AuthUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { MergeCartDto } from "./dto/merge-cart.dto";
import { SetCartItemQtyDto } from "./dto/set-cart-item-qty.dto";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMine(@CurrentUser() user: AuthUser) {
    return this.cartService.getMine(user.id);
  }

  @Post("items")
  addItem(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch("items/:productVariantId")
  setQuantity(
    @CurrentUser() user: AuthUser,
    @Param("productVariantId") productVariantId: string,
    @Body() dto: SetCartItemQtyDto,
  ) {
    return this.cartService.setQuantity(
      user.id,
      productVariantId,
      dto.quantity,
    );
  }

  @Delete("items/:productVariantId")
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param("productVariantId") productVariantId: string,
  ) {
    return this.cartService.removeItem(user.id, productVariantId);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser) {
    return this.cartService.clear(user.id);
  }

  @Post("merge")
  merge(@CurrentUser() user: AuthUser, @Body() dto: MergeCartDto) {
    return this.cartService.merge(user.id, dto);
  }
}
