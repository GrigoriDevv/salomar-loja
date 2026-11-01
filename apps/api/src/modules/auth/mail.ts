import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    await this.send({
      to: [email],
      subject: "Redefinir senha — Salomar",
      text: `Para redefinir sua senha, acesse: ${resetUrl}\n\nO link expira em 1 hora.`,
      devFallback: `link de reset (dev): ${resetUrl}`,
    });
  }

  /** Confirmação para o cliente quando o pagamento é aprovado. */
  async sendOrderPaid(email: string, order: OrderMailData): Promise<void> {
    const ordersUrl = `${this.webOrigin()}/conta/pedidos`;
    await this.send({
      to: [email],
      subject: `Pedido ${shortOrderId(order.id)} confirmado — Salomar`,
      text: [
        `Olá, ${order.customerName}!`,
        "",
        "Recebemos o pagamento do seu pedido. Agora é com a gente: vamos separar e enviar suas peças.",
        "",
        orderSummary(order),
        "",
        `Acompanhe seus pedidos em ${ordersUrl}`,
        "",
        "Salomar — O mar veste a gente.",
      ].join("\n"),
      devFallback: `confirmação do pedido ${order.id} para ${email}`,
    });
  }

  /** Aviso ao cliente quando o pedido sai para entrega. */
  async sendOrderShipped(
    email: string,
    order: { id: string; customerName: string; trackingCode: string },
  ): Promise<void> {
    await this.send({
      to: [email],
      subject: `Pedido ${shortOrderId(order.id)} enviado — Salomar`,
      text: [
        `Olá, ${order.customerName}!`,
        "",
        `Seu pedido ${shortOrderId(order.id)} saiu para entrega.`,
        `Código de rastreio: ${order.trackingCode}`,
        "Acompanhe em https://rastreamento.correios.com.br",
        "",
        `Seus pedidos: ${this.webOrigin()}/conta/pedidos`,
        "",
        "Salomar — O mar veste a gente.",
      ].join("\n"),
      devFallback: `aviso de envio ${order.id} (${order.trackingCode}) para ${email}`,
    });
  }

  /** Aviso de venda nova para a loja (STORE_NOTIFY_EMAIL, separado por vírgula). */
  async sendNewOrderAlert(order: OrderMailData & { customerEmail: string }) {
    const to = (this.config.get<string>("STORE_NOTIFY_EMAIL") ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (to.length === 0) return;

    await this.send({
      to,
      subject: `Venda nova: pedido ${shortOrderId(order.id)} (${formatBRL(order.totalCents)})`,
      text: [
        `Cliente: ${order.customerName} <${order.customerEmail}>`,
        "",
        orderSummary(order),
        "",
        `Admin: ${this.webOrigin()}/admin/pedidos`,
      ].join("\n"),
      devFallback: `aviso de venda nova ${order.id}`,
    });
  }

  private webOrigin(): string {
    const origin =
      this.config.get<string>("WEB_ORIGIN") ??
      this.config.get<string>("CORS_ORIGIN") ??
      "http://localhost:5173";
    return origin.split(",")[0].trim().replace(/\/$/, "");
  }

  private async send(msg: {
    to: string[];
    subject: string;
    text: string;
    devFallback: string;
  }): Promise<void> {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();
    const from =
      this.config.get<string>("RESEND_FROM")?.trim() ||
      "Salomar <onboarding@resend.dev>";

    if (!apiKey) {
      if (this.config.get<string>("NODE_ENV") !== "production") {
        this.logger.warn(`RESEND_API_KEY ausente — ${msg.devFallback}`);
      }
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(
        `Falha ao enviar e-mail Resend: ${res.status} ${detail}`,
      );
    }
  }
}

export type OrderMailData = {
  id: string;
  customerName: string;
  totalCents: number;
  shippingCents: number;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  shippingAddress: string;
};

export function shortOrderId(id: string): string {
  return id.slice(-8).toUpperCase();
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function orderSummary(order: OrderMailData): string {
  const lines = order.items.map(
    (i) =>
      `- ${i.quantity}x ${i.name} (${i.size}) — ${formatBRL(i.unitPriceCents * i.quantity)}`,
  );
  return [
    `Pedido ${shortOrderId(order.id)}`,
    ...lines,
    `Frete: ${formatBRL(order.shippingCents)}`,
    `Total: ${formatBRL(order.totalCents)}`,
    "",
    `Entrega: ${order.shippingAddress}`,
  ].join("\n");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}
