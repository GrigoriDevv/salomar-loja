import type { PrismaClient } from '../../generated/prisma'
import { purgeExpiredAuditRows } from '../audit/retention'

export type PurgeSensitiveDataResult = {
  failedWebhooks: number
  accessLogs: number
  expiredRefreshTokens: number
  anonymizedCpfWiped: number
}

/**
 * Expurga/anonimiza conforme docs/lgpd/data-retention-map.md
 */
export async function purgeExpiredSensitiveData(
  prisma: PrismaClient,
): Promise<PurgeSensitiveDataResult> {
  const audit = await purgeExpiredAuditRows(prisma)

  const expiredTokens = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  const anonymized = await prisma.user.updateMany({
    where: {
      anonymizedAt: { not: null },
      OR: [{ cpfEncrypted: { not: null } }, { cpfLookupHash: { not: null } }],
    },
    data: {
      cpfEncrypted: null,
      cpfLookupHash: null,
    },
  })

  return {
    failedWebhooks: audit.failedWebhooks,
    accessLogs: audit.accessLogs,
    expiredRefreshTokens: expiredTokens.count,
    anonymizedCpfWiped: anonymized.count,
  }
}
