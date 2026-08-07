import { getAccessToken } from "./auth-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type ShippingData = {
  fullName: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
};

export type PayerDocument = {
  type: "CPF" | "CNPJ";
  number: string;
};

export type CheckoutPayload = {
  token?: string;
  paymentMethodId: string;
  installments?: number;
  issueId?: string;
  payerDocument?: PayerDocument;
  shipping?: ShippingData;
};

export type CheckoutResult = {
  orderId: string;
  totalCents: number;
  paymentStatus: "pending" | "approved" | "rejected" | "refunded";
  mpStatus: string | null;
};

export type MyOrder = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
};

export async function postCheckout(
  body: CheckoutPayload,
): Promise<CheckoutResult> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Faça login para pagar");

  const res = await fetch(new URL("/checkout", API_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      token: body.token,
      paymentMethodId: body.paymentMethodId,
      installments: body.installments ?? 1,
      issueId: body.issueId,
      payerDocument: body.payerDocument,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.message === "string" ? err.message : "Falha no checkout",
    );
  }
  return res.json() as Promise<CheckoutResult>;
}

export async function getMyOrder(orderId: string): Promise<MyOrder> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("Faça login para consultar o pedido");

  const res = await fetch(new URL(`/me/orders/${orderId}`, API_URL), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404 ? "Pedido não encontrado" : "Falha ao consultar pedido",
    );
  }
  return res.json() as Promise<MyOrder>;
}

export async function pollMyOrderStatus(
  orderId: string,
  opts: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<{ paymentStatus: string; orderStatus: string }> {
  const intervalMs = opts.intervalMs ?? 2500;
  const maxAttempts = opts.maxAttempts ?? 48; // ~2 min
  let last = { paymentStatus: "pending", orderStatus: "pending" };

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await getMyOrder(orderId);
      last = {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
      };
      if (
        order.status === "paid" ||
        order.paymentStatus === "approved"
      ) {
        return last;
      }
      if (
        order.status === "failed" ||
        order.status === "canceled" ||
        order.paymentStatus === "rejected"
      ) {
        return last;
      }
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return last;
}
