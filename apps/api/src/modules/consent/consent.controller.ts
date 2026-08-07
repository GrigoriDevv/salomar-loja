import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt.guard";
import { ConsentService } from "./consent.service";
import { RecordConsentDto } from "./dto/record-consent.dto";

@Controller("consent")
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  record(
    @Body() dto: RecordConsentDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.consent.record(dto, user?.id);
  }

  @Get("current")
  current(@Query("visitorId") visitorId?: string) {
    return this.consent.currentForVisitor(visitorId ?? "");
  }
}

@Controller("me/consents")
@UseGuards(JwtAuthGuard)
export class MeConsentsController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  current(@CurrentUser() user: AuthUser) {
    return this.consent.currentForUser(user.id);
  }
}
