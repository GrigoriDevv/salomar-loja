import type { CartLineView } from "../types/CartLineTypes";
import { fetchProducts } from "./api";
import { buildVariantIndex } from "./enrich-cart";

export type StockProblem = {
  productVariantId: string;
  name: string;
  reason: "unavailable" | "clamped";
  available: number;
  requested: number;
};

export type ValidateCartStockResult = {
  ok: boolean;
  adjusted: CartLineView[];
  problems: StockProblem[];
};

/** Aplica estoque fresco às linhas do cart (clamp / remove). Puro — fácil de testar. */
export function applyStockToCart(
  items: CartLineView[],
  stockByVariantId: Map<string, number>,
): ValidateCartStockResult {
  const problems: StockProblem[] = [];
  const adjusted: CartLineView[] = [];

  for (const item of items) {
    const available = stockByVariantId.get(item.productVariantId);
    if (available === undefined || available < 1) {
      problems.push({
        productVariantId: item.productVariantId,
        name: item.name,
        reason: "unavailable",
        available: 0,
        requested: item.quantity,
      });
      continue;
    }

    if (item.quantity > available) {
      problems.push({
        productVariantId: item.productVariantId,
        name: item.name,
        reason: "clamped",
        available,
        requested: item.quantity,
      });
      adjusted.push({ ...item, quantity: available, stock: available });
      continue;
    }

    adjusted.push({ ...item, stock: available });
  }

  return {
    ok: problems.length === 0,
    adjusted,
    problems,
  };
}

/** Revalida estoque via catálogo API antes do checkout. */
export async function validateCartStock(
  items: CartLineView[],
): Promise<ValidateCartStockResult> {
  if (items.length === 0) {
    return { ok: true, adjusted: [], problems: [] };
  }

  const { data } = await fetchProducts({ page: 1, limit: 100 });
  const index = buildVariantIndex(data);
  const stockByVariantId = new Map<string, number>();

  for (const item of items) {
    const hit = index.get(item.productVariantId);
    stockByVariantId.set(item.productVariantId, hit?.variant.stock ?? 0);
  }

  return applyStockToCart(items, stockByVariantId);
}
