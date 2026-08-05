import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { CheckoutService } from "./checkout.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth-user.type";
import { CheckoutDto } from "./dto/checkout.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("checkout")
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.checkoutService.checkout(user.id, user.email, dto);
  }
}
