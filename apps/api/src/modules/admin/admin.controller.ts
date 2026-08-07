import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth-guards'
import { Roles } from '../auth/roles.decorators'
import { RolesGuard } from '../auth/roles.guard'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Roles("admin", "atendente")
  @Get("dashboard")
  dashboard() {
    return { ok: true, area: "admin" };
  }
}
