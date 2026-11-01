import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import {
  DEFAULT_SESSION_EXPIRES,
  durationInSeconds,
  SESSION_COOKIE,
} from "./session-cookie";

/**
 * Grava e apaga o cookie de sessão. `COOKIE_DOMAIN` divide o cookie entre loja e API em subdomínios
 * (`.salomar.com.br`); `COOKIE_SECURE` é `auto` (Secure quando a origem é https), `true` ou `false`.
 */
@Injectable()
export class SessionCookieService {
  constructor(private readonly config: ConfigService) {}

  set(request: Request, response: Response, token: string) {
    const expires = this.config.get<string>(
      "JWT_ACCESS_EXPIRES",
      DEFAULT_SESSION_EXPIRES,
    );
    const maxAge = durationInSeconds(expires) * 1000;
    response.cookie(SESSION_COOKIE, token, {
      ...this.options(request),
      maxAge,
    });
  }

  clear(request: Request, response: Response) {
    response.cookie(SESSION_COOKIE, "", { ...this.options(request), maxAge: 0 });
  }

  private options(request: Request): CookieOptions {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: this.secure(request),
      domain: this.config.get<string>("COOKIE_DOMAIN")?.trim() || undefined,
    };
  }

  private secure(request: Request) {
    const setting = (
      this.config.get<string>("COOKIE_SECURE") ?? "auto"
    ).toLowerCase();
    if (setting !== "auto") return setting === "true";
    return (
      request.secure || !!request.headers.origin?.startsWith("https://")
    );
  }
}
