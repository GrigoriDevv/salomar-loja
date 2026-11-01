import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { sessionToken } from "./session-cookie";
import { TokenService } from "./token.service";

/** Preenche `request.user` quando há sessão válida (Bearer ou cookie); sem ela, segue como anônimo. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = sessionToken(request.headers);
    if (!token) return true;
    try {
      request.user = await this.tokens.verifyAccess(token);
    } catch {
      /* sessão inválida ou encerrada: trata como anônimo */
    }
    return true;
  }
}
