export interface ProductFilters {
  category: string | null;
  size: string | null;
  tone: string | null;
  priceMin: number | null;
  priceMax: number | null;
}

export const emptyFilters: ProductFilters = {
  category: null,
  size: null,
  tone: null,
  priceMin: null,
  priceMax: null,
};
