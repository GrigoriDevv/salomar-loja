import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ConsentController,
  MeConsentsController,
} from "./consent.controller";
import { ConsentService } from "./consent.service";

@Module({
  imports: [AuthModule],
  controllers: [ConsentController, MeConsentsController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
