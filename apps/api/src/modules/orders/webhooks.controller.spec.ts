import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { WebhooksController } from "./webhooks.controller";
import type { PaymentsQueueService } from "./payments-queue.service";
import type { PrismaService } from "../../prisma/prisma.service";

describe("WebhooksController signature", () => {
  const secret = "whsec-test";
  const dataId = "999";
  const requestId = "rid-1";
  const ts = "1700000001";
  const v1 = createHmac("sha256", secret)
    .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
    .digest("hex");

  function makeController(opts: {
    secret?: string;
    queueReady?: boolean;
    claim?: unknown;
  }) {
    const prisma = {
      // claimWebhookEvent uses raw SQL — controller tests mock queue path after signature
    } as unknown as PrismaService;

    const queue = {
      isReady: opts.queueReady ?? true,
      enqueue: jest.fn().mockResolvedValue(undefined),
      releaseClaim: jest.fn(),
    } as unknown as PaymentsQueueService;

    const config = {
      get: (key: string) =>
        key === "MP_WEBHOOK_SECRET" ? opts.secret : undefined,
    } as unknown as ConfigService;

    const controller = new WebhooksController(prisma, queue, config);
    return { controller, queue };
  }

  it("retorna 401 com assinatura inválida quando secret configurado", async () => {
    const { controller } = makeController({ secret });
    await expect(
      controller.mercadopago(
        { data: { id: dataId }, action: "payment.updated" },
        `ts=${ts},v1=${"ab".repeat(32)}`,
        requestId,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("aceita assinatura válida e exige fila", async () => {
    const { controller } = makeController({ secret, queueReady: false });
    await expect(
      controller.mercadopago(
        { data: { id: dataId }, action: "payment.updated" },
        `ts=${ts},v1=${v1}`,
        requestId,
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
});
