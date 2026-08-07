import { getAccessToken } from "./auth-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type MyOrderSummary = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
};

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) throw new Error("Faça login");
  return { Authorization: `Bearer ${token}` };
}

export async function listMyOrders(
  page = 1,
  limit = 20,
): Promise<MyOrderSummary[]> {
  const url = new URL("/me/orders", API_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Falha ao listar pedidos");
  return res.json() as Promise<MyOrderSummary[]>;
}

export async function getMyOrder(orderId: string): Promise<MyOrderSummary> {
  const res = await fetch(new URL(`/me/orders/${orderId}`, API_URL), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Pedido não encontrado");
  return res.json() as Promise<MyOrderSummary>;
}
