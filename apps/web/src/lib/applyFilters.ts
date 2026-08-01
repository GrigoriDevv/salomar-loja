import type { Product } from "../data/catalog";
import type { ProductFilters } from "./filters";

export function applyFilters(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.size && !p.sizes.includes(filters.size)) return false;
    if (filters.tone && p.tone !== filters.tone) return false;
    if (filters.priceMin !== null && p.price < filters.priceMin) return false;
    if (filters.priceMax !== null && p.price > filters.priceMax) return false;
    return true;
  });
}
