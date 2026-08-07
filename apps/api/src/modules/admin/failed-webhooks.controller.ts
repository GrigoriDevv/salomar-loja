import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import type { FailedWebhookStatus } from "../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth-guards";
import { Roles } from "../auth/roles.decorators";
import { RolesGuard } from "../auth/roles.guard";
import { PaymentsQueueService } from "../orders/payments-queue.service";
import { claimWebhookEvent } from "../orders/webhook-event";

@Controller("admin/failed-webhooks")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class FailedWebhooksAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: PaymentsQueueService,
  ) {}

  @Get()
  list(@Query("status") status?: FailedWebhookStatus) {
    return this.prisma.failedWebhook.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  @Post(":id/reprocess")
  async reprocess(@Param("id") id: string) {
    if (!this.queue.isReady) {
      throw new ServiceUnavailableException(
        "Fila de webhooks indisponível (REDIS_URL)",
      );
    }

    const row = await this.prisma.failedWebhook.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException("FailedWebhook não encontrado");
    }

    const payload = row.payload as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };
    const paymentId = payload?.data?.id;
    if (!paymentId) {
      throw new NotFoundException("Payload sem data.id");
    }

    const messageId = `mp:${paymentId}:reprocess:${row.id}:${Date.now()}`;
    const claimed = await claimWebhookEvent(this.prisma, {
      messageId,
      paymentId: String(paymentId),
      payload: row.payload as never,
    });

    if (!claimed) {
      return { ok: true, duplicate: true, messageId };
    }

    await this.prisma.failedWebhook.update({
      where: { id },
      data: { status: "retrying" },
    });

    const traceId = row.traceId || randomUUID();

    try {
      await this.queue.enqueue({
        messageId,
        paymentId: String(paymentId),
        payload: payload as Record<string, unknown>,
        traceId,
        failedWebhookId: row.id,
      });
    } catch (error) {
      await this.queue.releaseClaim(messageId);
      await this.prisma.failedWebhook.update({
        where: { id },
        data: { status: "pending" },
      });
      throw error;
    }

    return { ok: true, id, messageId, status: "retrying" };
  }
}
