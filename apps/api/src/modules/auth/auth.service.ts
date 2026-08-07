import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { TokenService } from "./token.service";
import {
  generateResetToken,
  hashResetToken,
  MailService,
} from "./mail";

const GENERIC_RESET_MSG =
  "Se o e-mail existir, enviaremos instruções para redefinir a senha.";

@Injectable()
export class AuthService {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (user.anonymizedAt) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const passwordOK = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordOK) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const tokens = await this.tokens.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...tokens,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
      },
    });

    const tokens = await this.tokens.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      ...tokens,
    };
  }

  refresh(refreshToken: string) {
    return this.tokens.rotateRefresh(refreshToken);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        anonymizedAt: true,
      },
    });
    if (!user || user.anonymizedAt) {
      throw new UnauthorizedException("Usuário não encontrado");
    }
    const { anonymizedAt: _a, ...profile } = user;
    void _a;
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException("Informe a senha atual");
      }
      const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException("Senha atual inválida");
      }
    }

    let email = user.email;
    if (dto.email) {
      email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        const taken = await this.prisma.user.findUnique({ where: { email } });
        if (taken) {
          throw new ConflictException("E-mail já cadastrado");
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim() ?? undefined,
        email: dto.email ? email : undefined,
        passwordHash: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async forgotPassword(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = generateResetToken();
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const webOrigin =
        this.config.get<string>("WEB_ORIGIN")?.trim() ||
        this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
        "http://localhost:5173";
      const resetUrl = `${webOrigin.replace(/\/$/, "")}/conta/redefinir?token=${token}`;
      await this.mail.sendPasswordReset(user.email, resetUrl);
    }

    return { message: GENERIC_RESET_MSG };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashResetToken(token);
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Token inválido ou expirado");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Senha atualizada" };
  }
}
