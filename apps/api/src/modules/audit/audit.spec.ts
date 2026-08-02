import { PrismaClient } from '../../generated/prisma'
import { recordAccessLog } from './access-log.store'
import { recordFailedWebhook } from './failed-webhook.store'

const hasDatabase = Boolean(process.env.DATABASE_URL)

;(hasDatabase ? describe : describe.skip)('audit stores', () => {
  const prisma = new PrismaClient()
  const traceId = `trace-audit-${Date.now()}`
  let accessLogId = ''
  let failedWebhookId = ''

  afterAll(async () => {
    if (failedWebhookId) {
      await prisma.failedWebhook.delete({ where: { id: failedWebhookId } }).catch(() => undefined)
    }
    if (accessLogId) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.purging_access_logs', 'on', true)`
        await tx.accessLog.delete({ where: { id: accessLogId } })
      }).catch(() => undefined)
    }
    await prisma.$disconnect()
  })

  it('grava FailedWebhook e encontra por traceId', async () => {
    const row = await recordFailedWebhook(prisma, {
      payload: { event: 'payment.updated' },
      reason: 'signature_invalid',
      traceId,
      status: 'pending',
    })
    failedWebhookId = row.id

    const found = await prisma.failedWebhook.findMany({ where: { traceId } })
    expect(found).toHaveLength(1)
    expect(found[0].reason).toBe('signature_invalid')
  })

  it('grava AccessLog e bloqueia update/delete', async () => {
    const row = await recordAccessLog(prisma, {
      actor: 'admin@salomar.com.br',
      action: 'user.read',
      resource: 'User:test',
      detail: { fields: ['email'] },
    })
    accessLogId = row.id

    await expect(
      prisma.accessLog.update({
        where: { id: row.id },
        data: { action: 'tampered' },
      }),
    ).rejects.toThrow(/append-only/i)

    await expect(
      prisma.accessLog.delete({ where: { id: row.id } }),
    ).rejects.toThrow(/append-only/i)
  })
})
