import type { Product } from "../data/catalog";
import type { ProductFilters } from "./filters";

/**
 * Filtro client-side (fallback / testes).
 * Em produção a listagem preferencialmente filtra na API;
 * aqui "cor" olha variants[].color e, se não houver variants, cai no tone.
 */
export function applyFilters(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.size && !p.sizes.includes(filters.size)) return false;
    if (filters.color) {
      const colors =
        p.variants && p.variants.length > 0
          ? p.variants.map((v) => v.color)
          : [p.tone];
      if (!colors.includes(filters.color)) return false;
    }
    if (filters.priceMin !== null && p.price < filters.priceMin) return false;
    if (filters.priceMax !== null && p.price > filters.priceMax) return false;
    return true;
  });
}
