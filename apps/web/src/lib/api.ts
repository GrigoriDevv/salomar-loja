import type { IntentId, Product } from '../data/catalog'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface CatalogMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CatalogResponse {
  data: Product[]
  meta: CatalogMeta
}

export interface FetchProductsOptions {
  intent?: IntentId
  page?: number
  limit?: number
}

export function parseCatalogResponse(payload: unknown): CatalogResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta do catálogo inválida')
  }

  const body = payload as Partial<CatalogResponse>
  if (!Array.isArray(body.data) || !body.meta || typeof body.meta !== 'object') {
    throw new Error('Resposta do catálogo sem data/meta')
  }

  return {
    data: body.data,
    meta: body.meta as CatalogMeta,
  }
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<CatalogResponse> {
  const { intent, page = 1, limit = 50 } = options
  const url = new URL('/catalog/products', API_URL)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  if (intent) url.searchParams.set('intent', intent)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao carregar catálogo (${response.status})`)
  }

  return parseCatalogResponse(await response.json())
}
