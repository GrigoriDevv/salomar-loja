import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MpClient } from "./mp.client";
import { CheckoutDto, requiresCardToken } from "./dto/checkout.dto";
import { mapMpStatus, sanitizeMpPayload } from "./sanitize-mp";
import { insertPaymentIdempotent } from "./payment-idempotency";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MpClient,
  ) {}

  async finalizeOrder(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true },
      });

      if (!order) {
        throw new NotFoundException("Pedido não encontrado");
      }
      if (order.status === "paid") return;

      const approved = order.payments.some((p) => p.status === "approved");
      if (!approved) return;

      for (const item of order.items) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.productVariantId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new ConflictException(
            `Falha ao reservar estoque: ${item.productVariantId}`,
          );
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "paid" },
      });

      if (order.userId) {
        const cart = await tx.cart.findUnique({
          where: { userId: orderId },
        });

        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    });
  }

  async checkout(userId: string, email: string, dto: CheckoutDto) {
    if (requiresCardToken(dto.paymentMethodId) && !dto.token?.trim()) {
      throw new BadRequestException("Token do cartão é obrigatório");
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: { include: { product: true } },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Carrinho vazio");
    }

    for (const item of cart.items) {
      const v = item.productVariant;
      if (!v.active || !v.product.active) {
        throw new ConflictException(`Variante indisponível ${v.id}`);
      }
      if (item.quantity > v.stock) {
        throw new ConflictException(`Estoque insuficiente: ${v.id}`);
      }
    }

    const lines = cart.items.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      unitPriceCents: item.productVariant.product.priceCents,
    }));

    const totalCents = lines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          status: "pending",
          totalCents,
          currency: "BRL",
          items: {
            create: lines,
          },
        },
      });
      return created;
    });

    const mpPayment = await this.mp.createPayment({
      token: dto.token,
      amountReais: totalCents / 100,
      paymentMethodId: dto.paymentMethodId,
      installments: dto.installments ?? 1,
      issuerId: dto.issueId,
      orderId: order.id,
      payerEmail: email,
      idempotencyKey: crypto.randomUUID(),
      payerDocument: dto.payerDocument,
    });

    const transactionId = String(mpPayment.id);
    const paymentStatus = mapMpStatus(String(mpPayment.status ?? "pending"));

    await insertPaymentIdempotent(this.prisma, {
      orderId: order.id,
      amountCents: totalCents,
      transactionId,
      status: paymentStatus,
      rawPayload: sanitizeMpPayload(mpPayment),
    });

    if (paymentStatus === "approved") {
      await this.finalizeOrder(order.id);
    } else if (paymentStatus === "rejected") {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: "failed" },
      });
    }
    return {
      orderId: order.id,
      totalCents,
      paymentStatus,
      mpStatus: mpPayment.status ?? null,
    };
  }

  async getMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }

    const latest = order.payments[0];
    return {
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      paymentStatus: latest?.status ?? "pending",
      createdAt: order.createdAt,
    };
  }

  async listMyOrders(userId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      paymentStatus: order.payments[0]?.status ?? "pending",
      createdAt: order.createdAt,
    }));
  }

  async applyMpPaymentUpdate(mpPayment: Record<string, unknown>) {
    const transactionId = String(mpPayment.id);
    const orderId = String(mpPayment.external_reference ?? "");
    if (!orderId) {
      throw new BadRequestException("external_reference ausente");
    }

    const status = mapMpStatus(String(mpPayment.status ?? "pending"));
    const amount = Number(mpPayment.transaction_amount ?? 0);

    await insertPaymentIdempotent(this.prisma, {
      orderId,
      amountCents: Math.round(amount * 100),
      transactionId,
      status,
      rawPayload: sanitizeMpPayload(mpPayment),
    });

    await this.prisma.payment.updateMany({
      where: { transactionId },
      data: {
        status,
        rawPayload: sanitizeMpPayload(mpPayment),
      },
    });

    if (status === "approved") {
      await this.finalizeOrder(orderId);
    } else if (status === "rejected") {
      await this.prisma.order.updateMany({
        where: { id: orderId, status: "pending" },
        data: { status: "failed" },
      });
    }

    return { orderId, transactionId, status };
  }
}
