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
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { SensitiveRateLimit } from "../../common/rate-limit/rate-limit";
import { SessionCookieService } from "../auth/session-cookie.service";
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
    private readonly cookies: SessionCookieService,
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
  /** Com troca de senha, as outras sessões caem e o cookie passa a levar o token novo. */
  @Patch()
  @SensitiveRateLimit()
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { profile, tokens } = await this.authService.updateProfile(
      user.id,
      dto,
    );
    if (tokens) this.cookies.set(request, response, tokens.accessToken);
    return profile;
  }

  /** Canonical account deletion / anonymization */
  @Delete()
  @Header("Content-Type", "application/json")
  async deleteMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: AnonymizeAccountDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.privacy.anonymize(user.id, dto.confirm);
    this.cookies.clear(request, response);
    return result;
  }

  /** Alias */
  @Post("anonymize")
  async anonymize(
    @CurrentUser() user: AuthUser,
    @Body() dto: AnonymizeAccountDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.privacy.anonymize(user.id, dto.confirm);
    this.cookies.clear(request, response);
    return result;
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
