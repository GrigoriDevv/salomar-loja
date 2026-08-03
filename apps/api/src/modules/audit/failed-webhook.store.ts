import type {
  FailedWebhook,
  FailedWebhookStatus,
  Prisma,
  PrismaClient,
} from '../../generated/prisma'

export type RecordFailedWebhookInput = {
  payload: Prisma.InputJsonValue
  reason: string
  traceId: string
  status?: FailedWebhookStatus
}

export async function recordFailedWebhook(
  prisma: PrismaClient,
  input: RecordFailedWebhookInput,
): Promise<FailedWebhook> {
  return prisma.failedWebhook.create({
    data: {
      payload: input.payload,
      reason: input.reason,
      traceId: input.traceId,
      status: input.status ?? 'pending',
    },
  })
}
