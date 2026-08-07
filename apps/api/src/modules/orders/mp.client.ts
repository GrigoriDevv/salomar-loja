import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type CreateMpPaymentInput = {
  token?: string;
  amountReais: number;
  paymentMethodId: string;
  installments?: number;
  issuerId?: string;
  orderId: string;
  payerEmail: string;
  idempotencyKey: string;
  payerDocument?: { type: "CPF" | "CNPJ"; number: string };
};

@Injectable()
export class MpClient {
  constructor(private readonly config: ConfigService) {}

  private accessToken() {
    const token = this.config.get<string>("MP_ACCESS_TOKEN");

    if (!token) {
      throw new ServiceUnavailableException("MP_ACCESS_TOKEN não configurado");
    }
    return token;
  }

  async createPayment(input: CreateMpPaymentInput) {
    const payer: Record<string, unknown> = { email: input.payerEmail };
    if (input.payerDocument) {
      payer.identification = {
        type: input.payerDocument.type,
        number: input.payerDocument.number.replace(/\D/g, ""),
      };
    }

    const body: Record<string, unknown> = {
      transaction_amount: input.amountReais,
      payment_method_id: input.paymentMethodId,
      external_reference: input.orderId,
      payer,
    };

    if (input.token) {
      body.token = input.token;
      body.installments = input.installments ?? 1;
      if (input.issuerId) body.issuer_id = input.issuerId;
    } else {
      // Pix / boleto: 1 parcela implícita
      body.installments = 1;
    }

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new ServiceUnavailableException({
        message: "Falha ao criar pagamento no Mercado Pago",
        status: res.status,
        detail: data.message ?? data.error ?? null,
      });
    }
    return data;
  }

  async getPayment(paymentId: string) {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken()}` },
      },
    );
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new ServiceUnavailableException("Falha ao consultar pagamento MP");
    }
    return data;
  }
}
