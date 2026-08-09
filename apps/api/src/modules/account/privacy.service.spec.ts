import { PrismaClient } from '../../generated/prisma'
import type { PrismaService } from '../../prisma/prisma.service'
import { PrivacyService } from './privacy.service'
import { ConsentService } from '../consent/consent.service'

const hasDatabase = Boolean(process.env.DATABASE_URL)

;(hasDatabase ? describe : describe.skip)('PrivacyService LGPD', () => {
  const prisma = new PrismaClient() as unknown as PrismaService
  const privacy = new PrivacyService(prisma)
  const consent = new ConsentService(prisma)

  let userId = ''
  let orderId = ''
  let paymentId = ''

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `lgpd-spec-${Date.now()}@salomar.test`,
        name: 'Titular LGPD',
        passwordHash: 'hash-test',
      },
    })
    userId = user.id

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'paid',
        totalCents: 15000,
        currency: 'BRL',
      },
    })
    orderId = order.id

    const payment = await prisma.payment.create({
      data: {
        orderId,
        status: 'approved',
        amountCents: 15000,
        provider: 'mercadopago',
        transactionId: `tx-lgpd-${Date.now()}`,
      },
    })
    paymentId = payment.id
  })

  afterAll(async () => {
    if (paymentId) {
      await prisma.payment.delete({ where: { id: paymentId } }).catch(() => undefined)
    }
    if (orderId) {
      await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined)
    }
    if (userId) {
      await prisma.consent.deleteMany({ where: { userId } }).catch(() => undefined)
      await prisma.address.deleteMany({ where: { userId } }).catch(() => undefined)
      await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => undefined)
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }
    await prisma.$disconnect()
  })

  it('exporta JSON com profile e pedidos', async () => {
    const data = await privacy.exportData(userId, 'json')
    expect(typeof data).toBe('object')
    const payload = data as {
      profile: { email: string; id: string }
      orders: Array<{ id: string }>
    }
    expect(payload.profile.id).toBe(userId)
    expect(payload.orders.some((o) => o.id === orderId)).toBe(true)
  })

  it('exporta CSV não vazio', async () => {
    const csv = await privacy.exportData(userId, 'csv')
    expect(typeof csv).toBe('string')
    expect(csv as string).toContain('section,key,value')
    expect(csv as string).toContain('profile')
  })

  it('grava opt-out de marketing via ConsentService', async () => {
    await consent.record(
      {
        policyVersion: 'privacy-1.0',
        categories: {
          essential: true,
          analytics: false,
          marketing: false,
        },
      },
      userId,
    )
    const current = await consent.currentForUser(userId)
    expect(current.categories.marketing).toBe(false)
    expect(current.categories.essential).toBe(true)
  })

  it('anonimiza conta, zera CPF e preserva Order/Payment', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        cpfEncrypted: 'cipher-placeholder',
        cpfLookupHash: 'hash-placeholder',
      },
    })

    const result = await privacy.anonymize(userId, 'EXCLUIR')
    expect(result.ok).toBe(true)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user?.anonymizedAt).not.toBeNull()
    expect(user?.cpfEncrypted).toBeNull()
    expect(user?.cpfLookupHash).toBeNull()
    expect(user?.email).toMatch(/anonimizado\+/)

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })
    expect(order).not.toBeNull()
    expect(order?.userId).toBe(userId)
    expect(payment).not.toBeNull()
    expect(payment?.amountCents).toBe(15000)
  })
})
