import { NotFoundException } from "@nestjs/common";
import { FailedWebhooksAdminController } from "./failed-webhooks.controller";
import type { PrismaService } from "../../prisma/prisma.service";
import type { PaymentsQueueService } from "../orders/payments-queue.service";

describe("FailedWebhooksAdminController", () => {
  it("reprocess enfileira quando claim ok", async () => {
    const row = {
      id: "fw1",
      payload: { data: { id: "pay1" }, action: "payment.updated" },
      traceId: "t1",
      status: "pending",
    };

    const prisma = {
      failedWebhook: {
        findUnique: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockResolvedValue(row),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: "we1",
          messageId: "claimed",
          paymentId: "pay1",
          payload: row.payload,
          status: "queued",
          createdAt: new Date(),
          processedAt: null,
        },
      ]),
    } as unknown as PrismaService;

    const queue = {
      isReady: true,
      enqueue: jest.fn().mockResolvedValue(undefined),
      releaseClaim: jest.fn(),
    } as unknown as PaymentsQueueService;

    // claimWebhookEvent uses prisma.$queryRaw — patch module by using real claim with mocked prisma
    const controller = new FailedWebhooksAdminController(prisma, queue);

    // Override claim path: the controller calls claimWebhookEvent(prisma,...) which needs $queryRaw
    const result = await controller.reprocess("fw1");
    expect(result.ok).toBe(true);
    expect(queue.enqueue).toHaveBeenCalled();
    expect(prisma.failedWebhook.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "fw1" },
        data: { status: "retrying" },
      }),
    );
  });

  it("404 quando FailedWebhook não existe", async () => {
    const prisma = {
      failedWebhook: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const queue = { isReady: true } as unknown as PaymentsQueueService;
    const controller = new FailedWebhooksAdminController(prisma, queue);
    await expect(controller.reprocess("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
