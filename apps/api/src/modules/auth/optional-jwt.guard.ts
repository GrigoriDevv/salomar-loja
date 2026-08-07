import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

/** Attaches `request.user` when a valid Bearer access token is present; otherwise continues anonymously. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;

    if (!header?.startsWith("Bearer ")) {
      return true;
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

      if (payload.typ === "access") {
        request.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };
      }
    } catch {
      /* ignore invalid token — treat as anonymous */
    }

    return true;
  }
}
