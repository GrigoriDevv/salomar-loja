import type { CartLineDto } from "./merge-cart";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchCart(token: string): Promise<CartLineDto[]> {
  const response = await fetch(new URL("/cart", API_URL), {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar carrinho (${response.status})`);
  }

  const body = (await response.json()) as { items?: CartLineDto[] };
  if (!Array.isArray(body.items)) {
    throw new Error("Resposta de /cart inválida");
  }

  return body.items.map((item) => ({
    productVariantId: item.productVariantId,
    quantity: item.quantity,
  }));
}

/** Envia linhas locais para merge no servidor (POST /cart/merge). */
export async function mergeCart(
  token: string,
  items: CartLineDto[],
): Promise<CartLineDto[]> {
  if (items.length === 0) {
    return fetchCart(token);
  }

  const response = await fetch(new URL("/cart/merge", API_URL), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao sincronizar carrinho (${response.status})`);
  }

  const body = (await response.json()) as { items?: CartLineDto[] };
  if (!Array.isArray(body.items)) {
    throw new Error("Resposta de /cart/merge inválida");
  }

  return body.items.map((item) => ({
    productVariantId: item.productVariantId,
    quantity: item.quantity,
  }));
}
