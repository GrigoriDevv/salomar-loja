import type { IntentId, Product } from '../data/catalog'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function fetchProducts(intent?: IntentId): Promise<Product[]> {
  const url = new URL('/catalog/products', API_URL)
  if (intent) url.searchParams.set('intent', intent)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao carregar catálogo (${response.status})`)
  }

  return (await response.json()) as Product[]
}
