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

export type CheckoutPayload = {
  token: string;
  paymentMethodId: string;
  installments: number;
  issueId?: string;
  shipping?: ShippingData;
};

export type CheckoutResult = {
  orderId: string;
  totalCents: number;
  paymentStatus: "pending" | "approved" | "rejected" | "refunded";
  mpStatus: string | null;
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
      installments: body.installments,
      issueId: body.issueId,
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

/** Poll via GET /orders/:id (staff). Cliente costuma receber 401 — UI deve preferir paymentStatus do postCheckout. */
export async function pollCheckoutStatus(
  orderId: string,
  opts: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<CheckoutResult["paymentStatus"]> {
  const intervalMs = opts.intervalMs ?? 2500;
  const maxAttempts = opts.maxAttempts ?? 24;
  const accessToken = getAccessToken();
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(new URL(`/orders/${orderId}`, API_URL), {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (res.ok) {
      const data = (await res.json()) as {
        status?: string;
        paymentStatus?: string;
      };
      const status = (data.paymentStatus ?? data.status) as string | undefined;
      if (status === "paid" || status === "approved") return "approved";
      if (
        status === "failed" ||
        status === "rejected" ||
        status === "canceled"
      ) {
        return "rejected";
      }
    } else if (res.status === 401 || res.status === 403 || res.status === 404) {
      return "pending";
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return "pending";
}
