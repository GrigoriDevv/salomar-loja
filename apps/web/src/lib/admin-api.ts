import { getAccessToken } from "./auth-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
};

export type AdminVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
  active: boolean;
  productId: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  categoryId: string;
  material: string;
  fit: string;
  tone: string;
  image: string;
  alt: string;
  focus: string;
  intents: string[];
  priceCents: number;
  active: boolean;
  category?: AdminCategory;
  variants: AdminVariant[];
};

export type AdminOrder = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  payments?: { status: string; amountCents: number }[];
};

export type ProductInput = {
  slug: string;
  name: string;
  subtitle: string;
  categoryId: string;
  material: string;
  fit: string;
  tone: string;
  image: string;
  alt: string;
  focus: string;
  intents: string[];
  priceCents: number;
  variants: { size: string; color: string; stock: number }[];
};

function headers(): HeadersInit {
  const token = getAccessToken();
  if (!token) throw new Error("Faça login");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readError(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  if (typeof body?.message === "string") return body.message;
  if (Array.isArray(body?.message)) return body.message.join(", ");
  return fallback;
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const res = await fetch(new URL("/admin/products", API_URL), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await readError(res, "Falha ao listar produtos"));
  return res.json() as Promise<AdminProduct[]>;
}

export async function getAdminProduct(id: string): Promise<AdminProduct> {
  const res = await fetch(new URL(`/admin/products/${id}`, API_URL), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await readError(res, "Produto não encontrado"));
  return res.json() as Promise<AdminProduct>;
}

export async function createAdminProduct(
  input: ProductInput,
): Promise<AdminProduct> {
  const res = await fetch(new URL("/admin/products", API_URL), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res, "Falha ao criar produto"));
  return res.json() as Promise<AdminProduct>;
}

export async function updateAdminProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<AdminProduct> {
  const res = await fetch(new URL(`/admin/products/${id}`, API_URL), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res, "Falha ao atualizar produto"));
  return res.json() as Promise<AdminProduct>;
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const res = await fetch(new URL(`/admin/products/${id}`, API_URL), {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(await readError(res, "Falha ao remover produto"));
}

export async function updateVariantStock(
  productId: string,
  variantId: string,
  stock: number,
): Promise<AdminVariant> {
  const res = await fetch(
    new URL(`/admin/products/${productId}/variants/${variantId}`, API_URL),
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ stock }),
    },
  );
  if (!res.ok) throw new Error(await readError(res, "Falha ao atualizar estoque"));
  return res.json() as Promise<AdminVariant>;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const res = await fetch(new URL("/admin/categories", API_URL), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await readError(res, "Falha ao listar categorias"));
  return res.json() as Promise<AdminCategory[]>;
}

export async function listAdminOrders(status?: string): Promise<{
  data: AdminOrder[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const url = new URL("/orders", API_URL);
  if (status) url.searchParams.set("status", status);
  url.searchParams.set("limit", "50");
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(await readError(res, "Falha ao listar pedidos"));
  return res.json() as Promise<{
    data: AdminOrder[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }>;
}

export async function updateAdminOrderStatus(
  id: string,
  status: string,
  note?: string,
): Promise<unknown> {
  const res = await fetch(new URL(`/orders/${id}/status`, API_URL), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) throw new Error(await readError(res, "Falha ao atualizar status"));
  return res.json();
}
