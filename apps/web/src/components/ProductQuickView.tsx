import { useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { formatPrice, type Product } from '../data/catalog'
import { useCart } from '../state/store'

interface ProductQuickViewProps {
  product: Product | null
  onClose: () => void
}

export function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [size, setSize] = useState('')
  const [needsSize, setNeedsSize] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    const dialog = dialogRef.current
    if (product && dialog && !dialog.open) {
      setSize('')
      setNeedsSize(false)
      dialog.showModal()
    } else if (!product && dialog?.open) {
      dialog.close()
    }
  }, [product])

  const addToCart = () => {
    if (!product) return
    if (!size) {
      setNeedsSize(true)
      return
    }
    addItem(product, size)
    dialogRef.current?.close()
  }

  return (
    <dialog ref={dialogRef} className="quick-view" onClose={onClose} aria-labelledby="quick-view-title">
      {product && (
        <div className="quick-view__layout">
          <button className="icon-button quick-view__close" onClick={() => dialogRef.current?.close()} aria-label="Fechar detalhes">
            <X aria-hidden="true" />
          </button>
          <div className="quick-view__image">
            <img src={product.image} alt={product.alt} style={{ objectPosition: product.focus }} />
          </div>
          <div className="quick-view__content">
            <p className="meta">{product.category} · {product.tone}</p>
            <h2 id="quick-view-title">{product.name}</h2>
            <p className="quick-view__subtitle">{product.subtitle}</p>
            <p className="quick-view__price">{formatPrice(product.price)}</p>
            <dl className="product-facts">
              <div><dt>Matéria</dt><dd>{product.material}</dd></div>
              <div><dt>Caimento</dt><dd>{product.fit}</dd></div>
            </dl>
            <fieldset className="size-picker">
              <legend>Escolha o tamanho</legend>
              <div>
                {product.sizes.map((item) => (
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
            {needsSize && <p className="field-error" role="alert">Selecione um tamanho para continuar.</p>}
            <button className="primary-action" onClick={addToCart}>
              Adicionar à sacola <ArrowRight aria-hidden="true" />
            </button>
            <p className="shipping-note">Envio cortesia para todo o Brasil · Troca em até 30 dias</p>
          </div>
        </div>
      )}
    </dialog>
  )
}
