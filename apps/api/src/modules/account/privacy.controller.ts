import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { AnonymizeAccountDto } from "./dto/anonymize.dto";
import { PrivacyService } from "./privacy.service";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get("data-export")
  export(@CurrentUser() user: AuthUser) {
    return this.privacy.exportData(user.id);
  }

  @Post("anonymize")
  anonymize(
    @CurrentUser() user: AuthUser,
    @Body() dto: AnonymizeAccountDto,
  ) {
    return this.privacy.anonymize(user.id, dto.confirm);
  }
}
