import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { formatPrice, type Product } from "../data/catalog";
import { fetchProductBySlug } from "../lib/api";
import { useCart } from "../state/store";

const REVALIDATE_MS = 60_000;

interface ProductPurchasePanelProps {
  product: Product;
  onProductUpdate?: (product: Product) => void;
}

export function ProductPurchasePanel({
  product,
  onProductUpdate,
}: ProductPurchasePanelProps) {
  const [size, setSize] = useState("");
  const [needsSize, setNeedsSize] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [stockError, setStockError] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addItem, setOpen } = useCart();
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    setSize("");
    setNeedsSize(false);
    setStockError(false);
    setJustAdded(false);
  }, [product.id]);

  useEffect(() => {
    return () => {
      if (successTimer.current) window.clearTimeout(successTimer.current);
    };
  }, []);

  // Revalidação periódica de preço/estoque (equivalente CSR ao ISR de 60s).
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      fetchProductBySlug(product.id)
        .then((fresh) => {
          if (cancelled) return;
          onProductUpdate?.(fresh);
        })
        .catch(() => {
          /* mantém snapshot atual */
        });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const timer = window.setInterval(refresh, REVALIDATE_MS);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [product.id, onProductUpdate]);

  const addToCart = async () => {
    if (!product.inStock || product.stock <= 0) {
      setStockError(true);
      return;
    }
    if (!size) {
      setNeedsSize(true);
      return;
    }

    setAdding(true);
    setStockError(false);

    try {
      // Confirma preço/estoque live antes de mutar o carrinho.
      const fresh = await fetchProductBySlug(product.id);
      onProductUpdate?.(fresh);

      if (!fresh.inStock || fresh.stock <= 0) {
        setStockError(true);
        return;
      }

      addItem(fresh, size);
      setOpen(true);
      setJustAdded(true);
      if (successTimer.current) window.clearTimeout(successTimer.current);
      successTimer.current = window.setTimeout(() => setJustAdded(false), 1500);
    } catch {
      setStockError(true);
    } finally {
      setAdding(false);
    }
  };

  const soldOut = !product.inStock || product.stock <= 0;

  return (
    <div className="product-page__info">
      <p className="meta">
        {product.category} · {product.tone}
      </p>
      <h1>{product.name}</h1>
      <p>{product.subtitle}</p>
      <p className="product-page__price">{formatPrice(product.price)}</p>
      <p
        className={`product-page__stock${soldOut ? " is-sold-out" : ""}`}
        aria-live="polite"
      >
        {soldOut ? "Esgotado no momento" : `${product.stock} em estoque`}
      </p>

      <dl className="product-facts">
        <div>
          <dt>Matéria</dt>
          <dd>{product.material}</dd>
        </div>
        <div>
          <dt>Caimento</dt>
          <dd>{product.fit}</dd>
        </div>
        <div>
          <dt>Tom</dt>
          <dd>{product.tone}</dd>
        </div>
      </dl>

      <fieldset className="size-picker" disabled={soldOut}>
        <legend>Escolha o tamanho</legend>
        <div>
          {product.sizes.map((item) => (
            <button
              key={item}
              type="button"
              className={size === item ? "is-selected" : ""}
              aria-pressed={size === item}
              onClick={() => {
                setSize(item);
                setNeedsSize(false);
              }}
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
        type="button"
        className={`primary-action${justAdded ? " is-success" : ""}`}
        disabled={soldOut || justAdded || adding}
        onClick={() => void addToCart()}
      >
        {soldOut
          ? "Esgotado"
          : justAdded
            ? "Adicionado à sacola"
            : adding
              ? "Confirmando…"
              : "Adicionar à sacola"}
        {!soldOut && !justAdded && !adding && <ArrowRight aria-hidden="true" />}
      </button>
    </div>
  );
}
