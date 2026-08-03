import { PrismaClient } from '../../generated/prisma'
import { insertPaymentIdempotent } from './payment-idempotency'

const hasDatabase = Boolean(process.env.DATABASE_URL)

;(hasDatabase ? describe : describe.skip)('insertPaymentIdempotent', () => {
  const prisma = new PrismaClient()
  let orderId = ''
  let transactionId = ''

  beforeAll(async () => {
    const order = await prisma.order.create({
      data: {
        totalCents: 14900,
        currency: 'BRL',
        status: 'pending',
      },
    })
    orderId = order.id
    transactionId = `tx-concurrent-${Date.now()}`
  })

  afterAll(async () => {
    if (orderId) {
      await prisma.payment.deleteMany({ where: { orderId } })
      await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined)
    }
    await prisma.$disconnect()
  })

  it('insere uma única payment sob concorrência no mesmo transactionId', async () => {
    const attempts = Array.from({ length: 12 }, () =>
      insertPaymentIdempotent(prisma, {
        orderId,
        amountCents: 14900,
        transactionId,
        status: 'approved',
        messageId: `msg-${transactionId}`,
        rawPayload: { source: 'idempotency-spec' },
      }),
    )

    const results = await Promise.all(attempts)
    const createdOrFound = results.filter(Boolean)
    expect(createdOrFound.length).toBe(12)

    const uniqueIds = new Set(createdOrFound.map((payment) => payment!.id))
    expect(uniqueIds.size).toBe(1)

    const count = await prisma.payment.count({ where: { transactionId } })
    expect(count).toBe(1)
  })
})
