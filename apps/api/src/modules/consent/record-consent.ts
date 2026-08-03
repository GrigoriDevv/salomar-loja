import type {
  Consent,
  ConsentCategory,
  PrismaClient,
} from '../../generated/prisma'

export type RecordConsentInput = {
  userId?: string | null
  visitorId?: string | null
  category: ConsentCategory
  accepted: boolean
  policyVersion: string
}

export class ConsentSubjectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsentSubjectError'
  }
}

function resolveSubject(input: RecordConsentInput): {
  userId: string | null
  visitorId: string | null
} {
  const userId = input.userId?.trim() || null
  const visitorId = input.visitorId?.trim() || null

  if (userId && visitorId) {
    throw new ConsentSubjectError(
      'Consent must have either userId or visitorId, not both',
    )
  }
  if (!userId && !visitorId) {
    throw new ConsentSubjectError(
      'Consent requires userId or visitorId',
    )
  }

  return { userId, visitorId }
}

/** Appends a consent event (new row per preference change). */
export async function recordConsent(
  prisma: PrismaClient,
  input: RecordConsentInput,
): Promise<Consent> {
  const { userId, visitorId } = resolveSubject(input)

  return prisma.consent.create({
    data: {
      userId,
      visitorId,
      category: input.category,
      accepted: input.accepted,
      policyVersion: input.policyVersion,
    },
  })
}
