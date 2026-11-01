import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { createHash } from "crypto";
import type { AuthUser } from "./auth-user.type";
import { DEFAULT_SESSION_EXPIRES } from "./session-cookie";

type JwtTyp = "access" | "refresh";

type AccessPayload = {
  sub: string;
  typ: string;
  /** Versão de sessão do usuário na emissão; tokens antigos não têm o campo e valem como 0. */
  sv?: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  async issueTokens(user: {
    id: string;
    email: string;
    role: string;
    sessionVersion?: number;
  }) {
    const sv = user.sessionVersion ?? 0;
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sv,
        typ: "access" satisfies JwtTyp,
      },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES", DEFAULT_SESSION_EXPIRES),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sv,
        typ: "refresh" satisfies JwtTyp,
      },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get("JWT_REFRESH_EXPIRES", "7d"),
      },
    );
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async rotateRefresh(refreshToken: string) {
    let payload: { sub: string; email: string; role?: string; typ: string; sv?: number };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh inválido");
    }

    if (payload.typ !== "refresh") {
      throw new UnauthorizedException("Refresh inválido");
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, userId: payload.sub, revokedAt: null },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            sessionVersion: true,
            anonymizedAt: true,
          },
        },
      },
    });

    if (
      !stored ||
      stored.expiresAt < new Date() ||
      stored.user.anonymizedAt ||
      (payload.sv ?? 0) !== stored.user.sessionVersion
    ) {
      throw new UnauthorizedException("Refresh inválido");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({
      id: payload.sub,
      email: stored.user.email,
      role: stored.user.role,
      sessionVersion: stored.user.sessionVersion,
    });
  }

  /**
   * Valida o token de acesso (Bearer ou cookie) e devolve o usuário atual do banco. Recusa token de outra
   * versão de sessão (logout, troca ou redefinição de senha) e conta anonimizada.
   */
  async verifyAccess(token: string): Promise<AuthUser> {
    let payload: AccessPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
    if (payload.typ !== "access") {
      throw new UnauthorizedException("Token inválido");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        sessionVersion: true,
        anonymizedAt: true,
      },
    });
    if (
      !user ||
      user.anonymizedAt ||
      (payload.sv ?? 0) !== user.sessionVersion
    ) {
      throw new UnauthorizedException("Sessão encerrada");
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  /** Encerra todas as sessões do usuário: tokens de acesso e refresh emitidos antes deixam de valer. */
  async revokeAll(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { sessionVersion: { increment: 1 } },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
