import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthController, ProfileController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth-guards";
import { MailService } from "./mail";
import { RolesGuard } from "./roles.guard";
import { TokenService } from "./token.service";

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 100,
      },
      {
        name: "login",
        ttl: 60_000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AuthController, ProfileController],
  providers: [
    AuthService,
    TokenService,
    MailService,
    JwtAuthGuard,
    RolesGuard,
    ThrottlerGuard,
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, TokenService],
})
export class AuthModule {}
