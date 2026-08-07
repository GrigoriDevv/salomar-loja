import { Controller, Get } from '@nestjs/common'

@Controller()
export class SentryDebugController {
  @Get('debug-sentry')
  getError(): never {
    throw new Error('My first Sentry error!')
  }
}
