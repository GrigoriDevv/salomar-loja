import type { PrismaClient } from '../../generated/prisma'

/** Dead-letter webhooks kept for operational debugging. */
export const FAILED_WEBHOOK_RETENTION_DAYS = 90

/** Personal-data access audit trail (LGPD-oriented window). */
export const ACCESS_LOG_RETENTION_DAYS = 365

function daysAgo(days: number): Date {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date
}

/**
 * Purges audit rows older than the retention policy.
 * FailedWebhook uses Prisma deleteMany; AccessLog uses SECURITY DEFINER SQL
 * (append-only triggers block normal DELETE).
 */
export async function purgeExpiredAuditRows(prisma: PrismaClient): Promise<{
  failedWebhooks: number
  accessLogs: number
}> {
  const webhookCutoff = daysAgo(FAILED_WEBHOOK_RETENTION_DAYS)
  const accessCutoff = daysAgo(ACCESS_LOG_RETENTION_DAYS)

  const failed = await prisma.failedWebhook.deleteMany({
    where: { createdAt: { lt: webhookCutoff } },
  })

  const accessRows = await prisma.$queryRaw<Array<{ purge_access_logs_before: number }>>`
    SELECT purge_access_logs_before(${accessCutoff})
  `

  return {
    failedWebhooks: failed.count,
    accessLogs: Number(accessRows[0]?.purge_access_logs_before ?? 0),
  }
}
