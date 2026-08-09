import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { AuthService } from "../auth/auth.service";
import { UpdateProfileDto } from "../auth/dto/update-profile.dto";
import { ConsentService } from "../consent/consent.service";
import { AnonymizeAccountDto } from "./dto/anonymize.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { PrivacyService } from "./privacy.service";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(
    private readonly privacy: PrivacyService,
    private readonly authService: AuthService,
    private readonly consent: ConsentService,
  ) {}

  /** Canonical export — JSON (default) or CSV via ?format=csv */
  @Get("data")
  async exportData(
    @CurrentUser() user: AuthUser,
    @Query("format") format?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const fmt = format?.toLowerCase() === "csv" ? "csv" : "json";
    const result = await this.privacy.exportData(user.id, fmt);
    if (fmt === "csv" && typeof result === "string") {
      res?.setHeader("Content-Type", "text/csv; charset=utf-8");
      res?.setHeader(
        "Content-Disposition",
        'attachment; filename="salomar-meus-dados.csv"',
      );
      return new StreamableFile(Buffer.from(result, "utf8"));
    }
    return result;
  }

  /** Alias — always JSON */
  @Get("data-export")
  exportAlias(@CurrentUser() user: AuthUser) {
    return this.privacy.exportData(user.id, "json");
  }

  /** Canonical profile correction */
  @Patch()
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  /** Canonical account deletion / anonymization */
  @Delete()
  @Header("Content-Type", "application/json")
  deleteMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: AnonymizeAccountDto,
  ) {
    return this.privacy.anonymize(user.id, dto.confirm);
  }

  /** Alias */
  @Post("anonymize")
  anonymize(
    @CurrentUser() user: AuthUser,
    @Body() dto: AnonymizeAccountDto,
  ) {
    return this.privacy.anonymize(user.id, dto.confirm);
  }

  /** Preference center — immediate marketing opt-out */
  @Put("preferences")
  async updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const current = await this.consent.currentForUser(user.id);
    return this.consent.record(
      {
        policyVersion: dto.policyVersion?.trim() || "privacy-1.0",
        categories: {
          essential: true,
          analytics:
            dto.analytics === undefined
              ? Boolean(current.categories.analytics)
              : Boolean(dto.analytics),
          marketing: Boolean(dto.marketing),
        },
      },
      user.id,
    );
  }
}
