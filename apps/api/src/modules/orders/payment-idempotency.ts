import { createId } from './create-id'
import type { Payment, PaymentStatus, Prisma, PrismaClient } from '../../generated/prisma'

export type InsertPaymentInput = {
  orderId: string
  amountCents: number
  transactionId: string
  provider?: string
  status?: PaymentStatus
  messageId?: string | null
  rawPayload?: Prisma.InputJsonValue | null
}

/**
 * Inserts a payment idempotently by transactionId.
 * Concurrent callers with the same transactionId yield a single row.
 */
export async function insertPaymentIdempotent(
  prisma: PrismaClient,
  input: InsertPaymentInput,
): Promise<Payment | null> {
  const id = createId()
  const now = new Date()
  const provider = input.provider ?? 'mercadopago'
  const status = input.status ?? 'pending'
  const messageId = input.messageId ?? null
  const rawPayloadJson =
    input.rawPayload === undefined || input.rawPayload === null
      ? null
      : JSON.stringify(input.rawPayload)

  const rows = await prisma.$queryRaw<Payment[]>`
    INSERT INTO "Payment" (
      "id",
      "orderId",
      "provider",
      "status",
      "amountCents",
      "transactionId",
      "messageId",
      "rawPayload",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${id},
      ${input.orderId},
      ${provider},
      ${status}::"PaymentStatus",
      ${input.amountCents},
      ${input.transactionId},
      ${messageId},
      ${rawPayloadJson}::jsonb,
      ${now},
      ${now}
    )
    ON CONFLICT ("transactionId") DO NOTHING
    RETURNING *
  `

  if (rows[0]) {
    return rows[0]
  }

  return prisma.payment.findUnique({
    where: { transactionId: input.transactionId },
  })
}
