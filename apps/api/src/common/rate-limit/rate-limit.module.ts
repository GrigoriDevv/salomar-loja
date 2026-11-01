import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { defaultRateLimit } from "./rate-limit";

/** Rate limit por IP em todas as rotas. Atrás de proxy, configure TRUST_PROXY para o IP real ser usado. */
@Module({
  imports: [ThrottlerModule.forRoot([defaultRateLimit])],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
