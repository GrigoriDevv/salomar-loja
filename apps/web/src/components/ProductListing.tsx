import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { IntentId, Product } from '../data/catalog'
import { type CatalogMeta, fetchProducts } from '../lib/api'
import { collectFilterOptions } from '../lib/collectFilterOptions'
import { emptyFilters, type ProductFilters } from '../lib/filters'
import { rankProducts } from '../lib/intent'
import { ProductFiltersBar } from './FilterProducts'
import { ProductCard } from './ProductCard'

type CatalogStatus = 'loading' | 'ready' | 'error' | 'empty'

const PAGE_SIZE = 12

interface ProductListingProps {
  intent: IntentId
  title: string
  message: string
  onSelectProduct: (product: Product) => void
}

function toFetchFilters(filter: ProductFilters) {
  return {
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.size ? { size: filter.size } : {}),
    ...(filter.color ? { color: filter.color } : {}),
    ...(filter.priceMin !== null ? { priceMin: filter.priceMin } : {}),
    ...(filter.priceMax !== null ? { priceMax: filter.priceMax } : {}),
  }
}

export function ProductListing({
  intent,
  title,
  message,
  onSelectProduct,
}: ProductListingProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState(emptyFilters)
  const [appliedFilter, setAppliedFilter] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<CatalogMeta | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const hasMore = meta ? page < meta.totalPages : false

  const options = useMemo(() => collectFilterOptions(products), [products])
  const curated = useMemo(() => rankProducts(products, intent), [products, intent])
  const resultCount = meta?.total ?? curated.length

  // Debounce: preço digita sem spammar a API; selects também passam por aqui (~280ms).
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedFilter(filter), 280)
    return () => window.clearTimeout(timer)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setPage(1)
    setMeta(null)

    fetchProducts({ page: 1, limit: PAGE_SIZE, ...toFetchFilters(appliedFilter) })
      .then(({ data, meta: nextMeta }) => {
        if (cancelled) return
        setProducts(data)
        setMeta(nextMeta)
        setPage(nextMeta.page)
        setStatus(data.length === 0 ? 'empty' : 'ready')
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
        setMeta(null)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey, appliedFilter])

  const loadNextPage = () => {
    if (!hasMore || loadingMore || !meta) return

    const nextPage = page + 1
    setLoadingMore(true)

    fetchProducts({
      page: nextPage,
      limit: PAGE_SIZE,
      ...toFetchFilters(appliedFilter),
    })
      .then(({ data, meta: nextMeta }) => {
        setProducts((current) => {
          const seen = new Set(current.map((product) => product.id))
          const appended = data.filter((product) => !seen.has(product.id))
          return [...current, ...appended]
        })
        setMeta(nextMeta)
        setPage(nextMeta.page)
      })
      .catch(() => {
        // Mantém a lista já carregada; o usuário pode tentar de novo.
      })
      .finally(() => {
        setLoadingMore(false)
      })
  }

  return (
    <section className="curation-section" id="colecao" aria-labelledby="curation-title">
      <header className="section-heading">
        <div>
          <p className="meta">Curadoria atual</p>
          <h2 id="curation-title">{title}</h2>
        </div>
        <p aria-live="polite">{message}</p>
      </header>

      {(status === 'ready' || status === 'empty') && (
        <ProductFiltersBar
          filters={filter}
          onChange={setFilter}
          result={resultCount}
          options={options}
          onClear={() => setFilter(emptyFilters)}
        />
      )}

      <div className="product-flow" aria-busy={status === 'loading'}>
        {status === 'loading' && <p className="catalog-status">Carregando a coleção…</p>}

        {status === 'error' && (
          <div className="catalog-status catalog-status--action">
            <p>Não foi possível carregar o catálogo. Tente novamente em instantes.</p>
            <button
              type="button"
              className="text-link"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Tentar de novo
            </button>
          </div>
        )}

        {status === 'empty' && (
          <div className="catalog-status catalog-status--action">
            <p>Nenhuma peça com esse recorte.</p>
            <button type="button" className="text-link" onClick={() => setFilter(emptyFilters)}>
              Limpar filtros
            </button>
          </div>
        )}

        {status === 'ready' &&
          curated.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onSelect={onSelectProduct}
            />
          ))}
      </div>

      {status === 'ready' && hasMore && (
        <button
          type="button"
          className="quiet-action"
          disabled={loadingMore}
          onClick={loadNextPage}
        >
          {loadingMore ? 'Carregando…' : 'Ver mais peças'}
          {!loadingMore && <ArrowUpRight aria-hidden="true" />}
        </button>
      )}

      {status === 'ready' && curated[0] && (
        <button className="quiet-action" onClick={() => onSelectProduct(curated[0])}>
          Conhecer a seleção
          <ArrowUpRight aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
