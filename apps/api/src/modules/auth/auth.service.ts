import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
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
}
