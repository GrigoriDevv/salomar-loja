import type { Product } from '../data/catalog'

export function collectFilterOptions(products: Product[]) {
  const prices = products.map((p) => p.price)

  return {
    categories: [...new Set(products.map((p) => p.category))].sort(),
    sizes: [...new Set(products.flatMap((p) => p.sizes))].sort(),
    tones: [...new Set(products.map((p) => p.tone))].sort(),
    priceBounds: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  }
}
