import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController, ProfileController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth-guards";
import { MailService } from "./mail";
import { OptionalJwtAuthGuard } from "./optional-jwt.guard";
import { RolesGuard } from "./roles.guard";
import { SessionCookieService } from "./session-cookie.service";
import { TokenService } from "./token.service";

@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [AuthController, ProfileController],
  providers: [
    AuthService,
    TokenService,
    MailService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    SessionCookieService,
  ],
  exports: [
    MailService,
    JwtModule,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    TokenService,
    AuthService,
    SessionCookieService,
  ],
})
export class AuthModule {}
