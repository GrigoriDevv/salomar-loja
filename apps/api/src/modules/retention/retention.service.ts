import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { purgeExpiredSensitiveData } from './purge-sensitive-data'

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *')
  async handleDailyPurge(): Promise<void> {
    const result = await purgeExpiredSensitiveData(this.prisma)
    this.logger.log(
      `retention purge: webhooks=${result.failedWebhooks} accessLogs=${result.accessLogs} tokens=${result.expiredRefreshTokens} cpfWiped=${result.anonymizedCpfWiped}`,
    )
  }
}
