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
  category?: string
  size?: string
  color?: string
  priceMin?: number
  priceMax?: number
}

function normalizeProduct(payload: unknown): Product {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Produto inválido')
  }
  const raw = payload as Product & { stock?: number; inStock?: boolean }
  const stock = typeof raw.stock === 'number' ? raw.stock : 0
  return {
    ...raw,
    stock,
    inStock: typeof raw.inStock === 'boolean' ? raw.inStock : stock > 0,
  }
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
    data: body.data.map((item) => normalizeProduct(item)),
    meta: body.meta as CatalogMeta,
  }
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<CatalogResponse> {
  const {
    intent,
    page = 1,
    limit = 50,
    category,
    size,
    color,
    priceMin,
    priceMax,
  } = options
  const url = new URL('/catalog/products', API_URL)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  if (intent) url.searchParams.set('intent', intent)
  if (category) url.searchParams.set('category', category)
  if (size) url.searchParams.set('size', size)
  if (color) url.searchParams.set('color', color)
  if (priceMin !== undefined) url.searchParams.set('priceMin', String(priceMin))
  if (priceMax !== undefined) url.searchParams.set('priceMax', String(priceMax))

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao carregar catálogo (${response.status})`)
  }

  return parseCatalogResponse(await response.json())
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const url = new URL(`/catalog/products/${encodeURIComponent(slug)}`, API_URL)
  const response = await fetch(url)

  if (response.status === 404) {
    throw new Error('Produto não encontrado')
  }
  if (!response.ok) {
    throw new Error(`Falha ao carregar produto (${response.status})`)
  }

  return normalizeProduct(await response.json())
}
