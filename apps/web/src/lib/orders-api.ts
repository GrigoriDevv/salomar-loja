import { apiFetch } from "./http";
import { hasSession } from "./auth-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type MyOrderSummary = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  trackingCode: string | null;
  createdAt: string;
};

function authHeaders(): HeadersInit {
  if (!hasSession()) throw new Error("Faça login");
  return {};
}

export async function listMyOrders(
  page = 1,
  limit = 20,
): Promise<MyOrderSummary[]> {
  const url = new URL("/me/orders", API_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  const res = await apiFetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Falha ao listar pedidos");
  return res.json() as Promise<MyOrderSummary[]>;
}

export async function getMyOrder(orderId: string): Promise<MyOrderSummary> {
  const res = await apiFetch(new URL(`/me/orders/${orderId}`, API_URL), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Pedido não encontrado");
  return res.json() as Promise<MyOrderSummary>;
}
