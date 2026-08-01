import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente')
    }

    const token = header.slice(7);

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        typ: string;
      }>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });

      if (payload.typ !== "access") {
        throw new UnauthorizedException("Token Inválido");
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException("Token inválido");
    }
  }
}
