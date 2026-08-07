import type { Product } from "../data/catalog";
import type { CartLineView } from "../types/CartLineTypes";
import { fetchCart, mergeCart } from "./cart-api";
import { enrichCartLines } from "./enrich-cart";
import { mergeCartLines } from "./merge-cart";

type ReplaceCart = (items: CartLineView[]) => void;

/**
 * Após login: GET /cart → merge com localStorage → POST /cart/merge → atualiza UI.
 */
export async function syncCartOnLogin(
  token: string,
  localViews: CartLineView[],
  replace: ReplaceCart,
  catalogProducts?: Product[],
): Promise<void> {
  const local = localViews.map(({ productVariantId, quantity }) => ({
    productVariantId,
    quantity,
  }));

  const server = await fetchCart(token);
  const merged = mergeCartLines(local, server);
  const saved = await mergeCart(token, merged);
  const views = await enrichCartLines(saved, catalogProducts);
  replace(views);
}
