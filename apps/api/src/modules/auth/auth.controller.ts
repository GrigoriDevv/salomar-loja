import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { SensitiveRateLimit } from "../../common/rate-limit/rate-limit";
import { AuthService } from "./auth.service";
import type { AuthUser } from "./auth-user.type";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/password-reset.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "./jwt-auth-guards";
import { SessionCookieService } from "./session-cookie.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: SessionCookieService,
  ) {}

  /** Devolve os tokens (Bearer) e também grava o cookie httpOnly de sessão, usado pela loja no navegador. */
  @Post("register")
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);
    this.cookies.set(request, response, session.accessToken);
    return session;
  }

  @Post("login")
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.cookies.set(request, response, session.accessToken);
    return session;
  }

  @Post("refresh")
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refresh(dto.refreshToken);
    this.cookies.set(request, response, tokens.accessToken);
    return tokens;
  }

  /** Encerra a sessão em todos os dispositivos: tokens emitidos antes deixam de valer. */
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user.id);
    this.cookies.clear(request, response);
  }

  @Post("forgot-password")
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @SensitiveRateLimit()
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }
}

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: SessionCookieService,
  ) {}

  @Get("profile")
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }

  /** Com troca de senha, as outras sessões caem e o cookie passa a levar o token novo. */
  @Patch("profile")
  @SensitiveRateLimit()
  async updateProfile(
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
}
