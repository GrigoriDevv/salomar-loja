import type { CartLineDto } from "./merge-cart";

const API_URL = import.meta.env.VITE_API_URL;

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

  return body.items.map((items) => ({
    productVariantId: items.productVariantId,
    quantity: items.quantity,
  }));
}

export async function putCart(
  token: string,
  items: CartLineDto[],
): Promise<void> {
  const response = await fetch(new URL("/cart", API_URL), {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar carrinho (${response.status}`);
  }
}
