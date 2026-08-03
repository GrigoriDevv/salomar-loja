export interface ProductFilters {
  category: string | null;
  size: string | null;
  color: string | null;
  priceMin: number | null;
  priceMax: number | null;
}

export const emptyFilters: ProductFilters = {
  category: null,
  size: null,
  color: null,
  priceMin: null,
  priceMax: null,
};

/** True se algum critério está ativo (dispara refetch na API). */
export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.category !== null ||
    filters.size !== null ||
    filters.color !== null ||
    filters.priceMin !== null ||
    filters.priceMax !== null
  );
}
