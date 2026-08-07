import { Body, Controller, Headers, Post } from "@nestjs/common";
import { MpClient } from "./mp.client";
import { CheckoutService } from "./checkout.service";
import { PrismaService } from "../../prisma/prisma.service";
import { randomUUID } from "crypto";

@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly mp: MpClient,
    private readonly checkout: CheckoutService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("mercadopago")
  async mercadopago(
    @Body() body: { type?: string; action?: string; data?: { id?: string } },
    @Headers("x-request-id") requestId?: string,
  ) {
    const traceId = requestId ?? randomUUID();
    const paymentId = body?.data?.id;

    try {
      if (!paymentId) {
        return { ok: true, ignored: true };
      }

      //evita reprocessar o mesmo evento se vier messageId estável
      const messageId = `mp:${paymentId}:${body.action ?? body.type ?? "evt"}`;
      const existing = await this.prisma.payment.findFirst({
        where: { OR: [{ messageId }, { transactionId: String(paymentId) }] },
      });
      const mpPayment = await this.mp.getPayment(String(paymentId));
      const result = await this.checkout.applyMpPaymentUpdate(mpPayment);

      await this.prisma.payment.updateMany({
        where: { transactionId: String(paymentId) },
        data: { messageId },
      });

      if (existing?.messageId !== messageId) {
        await this.prisma.payment.updateMany({
          where: { transactionId: String(paymentId) },
          data: { messageId },
        });
      }
      return { ok: true, ...result };
    } catch (error) {
      return {
        ok: false,
        traceId,
        reason: error instanceof Error ? error.message : "webhook_error",
      };
    }
  }
}
