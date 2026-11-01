import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { sessionToken } from "./session-cookie";
import { TokenService } from "./token.service";

/** Exige sessão: token do `Authorization: Bearer` ou, sem ele, do cookie httpOnly do navegador. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = sessionToken(request.headers);
    if (!token) {
      throw new UnauthorizedException("Token ausente");
    }
    request.user = await this.tokens.verifyAccess(token);
    return true;
  }
}
