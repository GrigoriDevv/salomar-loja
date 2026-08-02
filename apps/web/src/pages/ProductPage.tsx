import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Product } from '../data/catalog'
import { fetchProductBySlug } from '../lib/api'
import { ProductGallery } from '../components/ProductGallery'
import { ProductPurchasePanel } from '../components/ProductPurchasePanel'
import { CartDrawer } from '../components/CartDrawer'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading')

  const handleProductUpdate = useCallback((fresh: Product) => {
    setProduct(fresh)
  }, [])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setStatus('loading')

    fetchProductBySlug(slug)
      .then((data) => {
        if (cancelled) return
        setProduct(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setProduct(null)
        setStatus(err.message.includes('não encontrado') ? 'notfound' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (status === 'loading') {
    return <p className="catalog-status product-page__status">Carregando a peça…</p>
  }

  if (status === 'notfound') {
    return (
      <p className="catalog-status product-page__status">
        Peça não encontrada. <Link to="/">Voltar à coleção</Link>
      </p>
    )
  }

  if (status === 'error' || !product) {
    return (
      <p className="catalog-status product-page__status">
        Não foi possível carregar. <Link to="/">Tente de novo pela coleção</Link>
      </p>
    )
  }

  return (
    <div className="site-shell">
      <article className="product-page">
        <Link to="/#colecao" className="text-link">
          ← Coleção
        </Link>

        <div className="product-page__layout">
          <ProductGallery images={[product.image]} alt={product.alt} focus={product.focus} />
          <ProductPurchasePanel product={product} onProductUpdate={handleProductUpdate} />
        </div>
      </article>
      <CartDrawer />
    </div>
  )
}
