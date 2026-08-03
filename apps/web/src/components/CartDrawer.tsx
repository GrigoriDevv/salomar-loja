import { useEffect, useRef } from 'react'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { formatPrice } from '../data/catalog'
import { useCart } from '../state/store'

export function CartDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { items, isOpen, subtotal, setOpen, setQuantity, removeItem } = useCart()

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && dialog && !dialog.open) dialog.showModal()
    if (!isOpen && dialog?.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="cart-drawer"
      onClose={() => setOpen(false)}
      aria-labelledby="cart-title"
    >
      <div className="cart-drawer__panel">
        <header>
          <div>
            <p className="meta">Sua seleção</p>
            <h2 id="cart-title">Sacola</h2>
          </div>
          <button className="icon-button" onClick={() => dialogRef.current?.close()} aria-label="Fechar sacola">
            <X aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag aria-hidden="true" />
            <h3>Sua sacola está leve.</h3>
            <p>Conte-nos a ocasião e encontre uma peça para ela.</p>
            <button className="text-link" onClick={() => dialogRef.current?.close()}>Voltar à descoberta</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.productVariantId}>
                  <img src={item.image} alt="" style={{ objectPosition: item.focus }} />
                  <div className="cart-item__details">
                    <h3>{item.name}</h3>
                    <p>{item.color} · Tamanho {item.size}</p>
                    <p>{formatPrice(item.unitPrice)}</p>
                    <div className="quantity-control" aria-label={`Quantidade de ${item.name}`}>
                      <button
                        aria-label="Diminuir quantidade"
                        onClick={() => setQuantity(item.productVariantId, item.quantity - 1)}
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        aria-label="Aumentar quantidade"
                        onClick={() => setQuantity(item.productVariantId, item.quantity + 1)}
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      className="remove-link"
                      onClick={() => removeItem(item.productVariantId)}
                    >
                      Remover
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <footer className="cart-summary">
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <p>Frete calculado na etapa seguinte.</p>
              <button className="primary-action" disabled title="Checkout disponível na próxima fase">
                Finalização em breve
              </button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  )
}
