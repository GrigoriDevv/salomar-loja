import { PrismaClient } from '../../generated/prisma'
import { claimWebhookEvent } from './webhook-event'

const hasDatabase = Boolean(process.env.DATABASE_URL)

;(hasDatabase ? describe : describe.skip)('claimWebhookEvent', () => {
  const prisma = new PrismaClient()
  const messageId = `msg-concurrent-${Date.now()}`

  afterAll(async () => {
    await prisma.webhookEvent.deleteMany({ where: { messageId } })
    await prisma.$disconnect()
  })

  it('insere um único WebhookEvent sob concorrência no mesmo messageId', async () => {
    const attempts = Array.from({ length: 12 }, () =>
      claimWebhookEvent(prisma, {
        messageId,
        paymentId: 'pay-1',
        payload: { source: 'claim-spec' },
      }),
    )

    const results = await Promise.all(attempts)
    const claimed = results.filter(Boolean)
    expect(claimed.length).toBe(1)

    const count = await prisma.webhookEvent.count({ where: { messageId } })
    expect(count).toBe(1)
  })
})
