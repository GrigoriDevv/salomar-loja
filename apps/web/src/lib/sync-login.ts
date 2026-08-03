import type { CartLineView } from "../types/CartLineTypes";
import { fetchCart, putCart } from "./cart-api";
import { enrichCartLines } from "./enrich-cart";
import { mergeCartLines } from "./merge-cart";

type ReplaceCart = (items: CartLineView[]) => void;

export async function syncCartOnLogin(
  token: string,
  localviews: CartLineView[],
  replace: ReplaceCart,
  catalogProducts?: CartLineView extends never
    ? never
    : import("../data/catalog").Product[],
): Promise<void> {
  const local = localviews.map(({ productVariantId, quantity }) => ({
    productVariantId,
    quantity,
  }));

  const server = await fetchCart(token);
  const merged = mergeCartLines(local, server);
  await putCart(token, merged);

  const views = await enrichCartLines(merged, catalogProducts);
  replace(views);
}
