import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { trustedOriginMiddleware } from "./trusted-origin";

/** Lista separada por vírgula (`CORS_ORIGIN`), sem espaços nem itens vazios. */
export function parseOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Configuração HTTP compartilhada pela API (main.ts), pela função da Vercel e pelos testes, para todos
 * rodarem o mesmo app. `origins` vazio bloqueia chamadas de outros domínios no navegador.
 */
export function configureApp(
  app: INestApplication,
  options: { origins: string[]; trustProxy?: number },
) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Loja e API ficam no mesmo site (localhost, ou loja.com.br e api.loja.com.br).
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.enableCors({
    origin: options.origins.length ? options.origins : false,
    credentials: true,
  });
  app.use(trustedOriginMiddleware(options.origins));
  // Atrás de load balancer ou proxy reverso, o rate limit precisa do IP do cliente, não do proxy.
  if (options.trustProxy && options.trustProxy > 0) {
    (app as NestExpressApplication).set("trust proxy", options.trustProxy);
  }
  return app;
}
