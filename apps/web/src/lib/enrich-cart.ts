import type { Product } from "../data/catalog";
import type { CartLineView } from "../types/CartLineTypes";
import { fetchProducts } from "./api";
import type { CartLineDto } from "./merge-cart";

type VariantIndexEntry = {
  product: Product;
  variant: NonNullable<Product["variants"]>[number];
};

export function buildVariantIndex(
  products: Product[],
): Map<string, VariantIndexEntry> {
  const index = new Map<string, VariantIndexEntry>();
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      index.set(variant.id, { product, variant });
    }
  }

  return index;
}

export async function enrichCartLines(
  lines: CartLineDto[],
  products?: Product[],
): Promise<CartLineView[]> {
  const catalog =
    products ?? (await fetchProducts({ page: 1, limit: 100 })).data;
  const index = buildVariantIndex(catalog);
  const views: CartLineView[] = [];

  for (const line of lines) {
    const hit = index.get(line.productVariantId);
    if (!hit) continue;

    const { product, variant } = hit;
    views.push({
      productVariantId: variant.id,
      quantity: line.quantity,
      productId: product.id,
      name: product.name,
      size: variant.size,
      color: variant.color,
      unitPrice: product.price,
      image: product.image,
      focus: product.focus,
      stock: variant.stock,
    });
  }
  return views;
}
