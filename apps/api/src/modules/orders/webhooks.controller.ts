import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SkipThrottle } from "@nestjs/throttler";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { verifyMpWebhookSignature } from "./mp-webhook-signature";
import { PaymentsQueueService } from "./payments-queue.service";
import { claimWebhookEvent } from "./webhook-event";

type MpWebhookBody = {
  type?: string;
  action?: string;
  data?: { id?: string };
};

// O Mercado Pago chama de poucos IPs compartilhados; a assinatura HMAC é o controle aqui, não o rate limit.
@SkipThrottle()
@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: PaymentsQueueService,
    private readonly config: ConfigService,
  ) {}

  @Post("mercadopago")
  @HttpCode(200)
  async mercadopago(
    @Body() body: MpWebhookBody,
    @Headers("x-signature") xSignature?: string,
    @Headers("x-request-id") xRequestId?: string,
  ) {
    const traceId = xRequestId?.trim() || randomUUID();
    const paymentId = body?.data?.id?.trim();

    if (!paymentId) {
      return { ok: true, ignored: true, traceId };
    }

    const secret = this.config.get<string>("MP_WEBHOOK_SECRET")?.trim();
    // Em produção, sem segredo não há como saber quem chamou: recusa (fail closed).
    if (!secret && this.config.get<string>("NODE_ENV") === "production") {
      throw new UnauthorizedException("MP_WEBHOOK_SECRET não configurado");
    }
    if (secret) {
      const valid = verifyMpWebhookSignature({
        secret,
        xSignature,
        xRequestId,
        dataId: paymentId,
      });
      if (!valid) {
        throw new UnauthorizedException("Assinatura do webhook inválida");
      }
    }

    if (!this.queue.isReady) {
      throw new ServiceUnavailableException(
        "Fila de webhooks indisponível (REDIS_URL)",
      );
    }

    const messageId = `mp:${paymentId}:${body.action ?? body.type ?? "evt"}`;
    const claimed = await claimWebhookEvent(this.prisma, {
      messageId,
      paymentId,
      payload: body as never,
    });

    if (!claimed) {
      return { ok: true, duplicate: true, messageId, traceId };
    }

    try {
      await this.queue.enqueue({
        messageId,
        paymentId: String(paymentId),
        payload: body as Record<string, unknown>,
        traceId,
      });
    } catch (error) {
      await this.queue.releaseClaim(messageId);
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : "Falha ao enfileirar webhook",
      );
    }

    return { ok: true, queued: true, messageId, traceId };
  }
}
