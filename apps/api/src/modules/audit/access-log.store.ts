import type { AccessLog, Prisma, PrismaClient } from '../../generated/prisma'

export type RecordAccessLogInput = {
  actor: string
  action: string
  resource: string
  detail?: Prisma.InputJsonValue | null
}

/** Append-only insert. UPDATE/DELETE are blocked by a Postgres trigger. */
export async function recordAccessLog(
  prisma: PrismaClient,
  input: RecordAccessLogInput,
): Promise<AccessLog> {
  return prisma.accessLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      resource: input.resource,
      detail: input.detail ?? undefined,
    },
  })
}
