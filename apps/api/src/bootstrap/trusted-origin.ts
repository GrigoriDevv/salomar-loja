import type { NextFunction, Request, Response } from "express";
import { readCookie, SESSION_COOKIE } from "../modules/auth/session-cookie";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type RequestLike = Pick<Request, "method" | "headers">;

/**
 * Pedido que muda dados e chega autenticado só pelo cookie: o navegador manda o cookie sozinho, então a
 * origem precisa ser a da loja (proteção contra CSRF). Com Bearer não há risco, e webhooks não usam cookie.
 */
export function needsTrustedOrigin({ method, headers }: RequestLike) {
  if (!UNSAFE_METHODS.has(method.toUpperCase())) return false;
  if (headers.authorization?.startsWith("Bearer ")) return false;
  return !!readCookie(headers.cookie, SESSION_COOKIE);
}

export function isTrustedOrigin(
  request: RequestLike,
  allowedOrigins: readonly string[],
) {
  const origin = request.headers.origin;
  return (
    !needsTrustedOrigin(request) ||
    (!!origin && allowedOrigins.includes(origin))
  );
}

/** Middleware global: responde 403 no formato de erro do Nest antes de qualquer rota. */
export function trustedOriginMiddleware(allowedOrigins: readonly string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (isTrustedOrigin(request, allowedOrigins)) return next();
    response.status(403).json({
      statusCode: 403,
      message: "Origem não permitida",
      error: "Forbidden",
    });
  };
}
