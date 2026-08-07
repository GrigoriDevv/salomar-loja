import { createId } from './create-id'
import type {
  Prisma,
  PrismaClient,
  WebhookEvent,
} from '../../generated/prisma'

export type ClaimWebhookEventInput = {
  messageId: string
  paymentId?: string | null
  payload: Prisma.InputJsonValue
}

/**
 * Claims a webhook event idempotently by messageId.
 * Concurrent callers with the same messageId yield a single row;
 * losers get null (ON CONFLICT DO NOTHING).
 */
export async function claimWebhookEvent(
  prisma: PrismaClient,
  input: ClaimWebhookEventInput,
): Promise<WebhookEvent | null> {
  const id = createId()
  const now = new Date()
  const paymentId = input.paymentId?.trim() || null
  const payloadJson = JSON.stringify(input.payload)

  const rows = await prisma.$queryRaw<WebhookEvent[]>`
    INSERT INTO "WebhookEvent" (
      "id",
      "messageId",
      "paymentId",
      "payload",
      "status",
      "createdAt",
      "processedAt"
    ) VALUES (
      ${id},
      ${input.messageId},
      ${paymentId},
      ${payloadJson}::jsonb,
      'queued'::"WebhookEventStatus",
      ${now},
      NULL
    )
    ON CONFLICT ("messageId") DO NOTHING
    RETURNING *
  `

  return rows[0] ?? null
}

export async function markWebhookEventProcessed(
  prisma: PrismaClient,
  messageId: string,
): Promise<void> {
  await prisma.webhookEvent.updateMany({
    where: { messageId },
    data: { status: 'processed', processedAt: new Date() },
  })
}

export async function markWebhookEventFailed(
  prisma: PrismaClient,
  messageId: string,
): Promise<void> {
  await prisma.webhookEvent.updateMany({
    where: { messageId },
    data: { status: 'failed', processedAt: new Date() },
  })
}

export async function releaseWebhookEventClaim(
  prisma: PrismaClient,
  messageId: string,
): Promise<void> {
  await prisma.webhookEvent.deleteMany({ where: { messageId } })
}
