import { useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { formatPrice, type Product } from '../data/catalog'
import { fetchProductBySlug } from '../lib/api'
import { useCart } from '../state/store'

interface ProductQuickViewProps {
  product: Product | null
  onClose: () => void
}

export function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [size, setSize] = useState('')
  const [needsSize, setNeedsSize] = useState(false)
  const [stockError, setStockError] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [liveProduct, setLiveProduct] = useState<Product | null>(null)
  const { addItem, setOpen } = useCart()
  const current = liveProduct ?? product
  const soldOut = !current?.inStock || (current?.stock ?? 0) <= 0

  useEffect(() => {
    const dialog = dialogRef.current
    if (product && dialog && !dialog.open) {
      setSize('')
      setNeedsSize(false)
      setStockError(false)
      setJustAdded(false)
      setLiveProduct(product)
      dialog.showModal()
      // Revalida preço/estoque ao abrir.
      void fetchProductBySlug(product.id)
        .then(setLiveProduct)
        .catch(() => undefined)
    } else if (!product && dialog?.open) {
      dialog.close()
      setLiveProduct(null)
    }
  }, [product])

  const addToCart = async () => {
    if (!current) return
    if (soldOut) {
      setStockError(true)
      return
    }
    if (!size) {
      setNeedsSize(true)
      return
    }

    setAdding(true)
    setStockError(false)
    try {
      const fresh = await fetchProductBySlug(current.id)
      setLiveProduct(fresh)
      if (!fresh.inStock || fresh.stock <= 0) {
        setStockError(true)
        return
      }
      addItem(fresh, size)
      setOpen(true)
      setJustAdded(true)
      dialogRef.current?.close()
    } catch {
      setStockError(true)
    } finally {
      setAdding(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="quick-view"
      onClose={onClose}
      aria-labelledby="quick-view-title"
    >
      {current && (
        <div className="quick-view__layout">
          <button
            className="icon-button quick-view__close"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar detalhes"
          >
            <X aria-hidden="true" />
          </button>
          <div className="quick-view__image">
            <img
              src={current.image}
              alt={current.alt}
              style={{ objectPosition: current.focus }}
            />
          </div>
          <div className="quick-view__content">
            <p className="meta">
              {current.category} · {current.tone}
            </p>
            <h2 id="quick-view-title">{current.name}</h2>
            <p className="quick-view__subtitle">{current.subtitle}</p>
            <p className="quick-view__price">{formatPrice(current.price)}</p>
            <p className={`product-page__stock${soldOut ? ' is-sold-out' : ''}`} aria-live="polite">
              {soldOut ? 'Esgotado no momento' : `${current.stock} em estoque`}
            </p>
            <dl className="product-facts">
              <div>
                <dt>Matéria</dt>
                <dd>{current.material}</dd>
              </div>
              <div>
                <dt>Caimento</dt>
                <dd>{current.fit}</dd>
              </div>
            </dl>
            <fieldset className="size-picker" disabled={soldOut}>
              <legend>Escolha o tamanho</legend>
              <div>
                {current.sizes.map((item) => (
                  <button
                    type="button"
                    className={size === item ? 'is-selected' : ''}
                    aria-pressed={size === item}
                    onClick={() => {
                      setSize(item)
                      setNeedsSize(false)
                    }}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
            {needsSize && (
              <p className="field-error" role="alert">
                Selecione um tamanho para continuar.
              </p>
            )}
            {stockError && (
              <p className="field-error" role="alert">
                Esta peça ficou indisponível. Atualizamos o estoque.
              </p>
            )}
            <button
              className={`primary-action${justAdded ? ' is-success' : ''}`}
              disabled={soldOut || adding || justAdded}
              onClick={() => void addToCart()}
            >
              {soldOut
                ? 'Esgotado'
                : adding
                  ? 'Confirmando…'
                  : 'Adicionar à sacola'}
              {!soldOut && !adding && <ArrowRight aria-hidden="true" />}
            </button>
            <p className="shipping-note">
              Envio cortesia para todo o Brasil · Troca em até 30 dias
            </p>
          </div>
        </div>
      )}
    </dialog>
  )
}
