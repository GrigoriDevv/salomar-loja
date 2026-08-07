import type { Product } from '../data/catalog'

export function collectFilterOptions(products: Product[]) {
  const prices = products.map((p) => p.price)
  const colors = new Set<string>()
  for (const product of products) {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) colors.add(variant.color)
    } else if (product.tone) {
      colors.add(product.tone)
    }
  }

  return {
    categories: [...new Set(products.map((p) => p.category))].sort(),
    sizes: [...new Set(products.flatMap((p) => p.sizes))].sort(),
    colors: [...colors].sort(),
    priceBounds: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  }
}
