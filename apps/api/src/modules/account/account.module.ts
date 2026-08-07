import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./addresses.service";
import { PrivacyController } from "./privacy.controller";
import { PrivacyService } from "./privacy.service";

@Module({
  imports: [AuthModule],
  controllers: [AddressesController, PrivacyController],
  providers: [AddressesService, PrivacyService],
})
export class AccountModule {}
