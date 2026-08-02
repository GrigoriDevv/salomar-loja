import { PrismaClient } from '../../generated/prisma'
import { ConsentSubjectError, recordConsent } from './record-consent'

const hasDatabase = Boolean(process.env.DATABASE_URL)

;(hasDatabase ? describe : describe.skip)('recordConsent', () => {
  const prisma = new PrismaClient()
  const visitorId = `visitor-consent-${Date.now()}`
  const createdIds: string[] = []
  let userId = ''

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Consent Spec',
        email: `consent-spec-${Date.now()}@salomar.test`,
        passwordHash: 'unused-for-spec',
        role: 'cliente',
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.consent.deleteMany({ where: { id: { in: createdIds } } })
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }
    await prisma.$disconnect()
  })

  it('grava consentimento com visitorId', async () => {
    const row = await recordConsent(prisma, {
      visitorId,
      category: 'analytics',
      accepted: true,
      policyVersion: 'privacy-1.0',
    })
    createdIds.push(row.id)
    expect(row.visitorId).toBe(visitorId)
    expect(row.userId).toBeNull()
    expect(row.accepted).toBe(true)
  })

  it('grava consentimento com userId', async () => {
    const row = await recordConsent(prisma, {
      userId,
      category: 'marketing',
      accepted: false,
      policyVersion: 'privacy-1.0',
    })
    createdIds.push(row.id)
    expect(row.userId).toBe(userId)
    expect(row.visitorId).toBeNull()
  })

  it('rejeita sem subject e com ambos', async () => {
    await expect(
      recordConsent(prisma, {
        category: 'essential',
        accepted: true,
        policyVersion: 'privacy-1.0',
      }),
    ).rejects.toBeInstanceOf(ConsentSubjectError)

    await expect(
      recordConsent(prisma, {
        userId,
        visitorId,
        category: 'essential',
        accepted: true,
        policyVersion: 'privacy-1.0',
      }),
    ).rejects.toBeInstanceOf(ConsentSubjectError)
  })
})
