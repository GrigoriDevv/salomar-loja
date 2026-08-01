import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { TokenService } from "./token.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  imports: [JwtModule.register({})],
  exports: [TokenService],
})
export class AuthModule {}
