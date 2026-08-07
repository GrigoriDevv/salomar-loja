import { PrismaClient } from '../../generated/prisma'
import { claimWebhookEvent } from './webhook-event'

const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * Simulates N workers racing on the same webhook messageId:
 * only one claim wins; processing side-effect (marker row) runs once.
 */
;(hasDatabase ? describe : describe.skip)(
  'webhook concurrency (claim + single process)',
  () => {
    const prisma = new PrismaClient()
    const messageId = `msg-workers-${Date.now()}`
    const paymentId = `pay-workers-${Date.now()}`

    afterAll(async () => {
      await prisma.webhookEvent.deleteMany({
        where: { messageId: { startsWith: 'msg-workers-' } },
      })
      await prisma.$disconnect()
    })

    it('apenas um worker processa o mesmo evento', async () => {
      let processed = 0

      async function worker() {
        const claimed = await claimWebhookEvent(prisma, {
          messageId,
          paymentId,
          payload: { data: { id: paymentId }, action: 'payment.updated' },
        })
        if (!claimed) return
        // simulate applyMpPaymentUpdate side effect
        processed += 1
        await prisma.webhookEvent.update({
          where: { id: claimed.id },
          data: { status: 'processed', processedAt: new Date() },
        })
      }

      await Promise.all(Array.from({ length: 8 }, () => worker()))

      expect(processed).toBe(1)
      const row = await prisma.webhookEvent.findUnique({ where: { messageId } })
      expect(row?.status).toBe('processed')
      expect(row?.paymentId).toBe(paymentId)
    })
  },
)
