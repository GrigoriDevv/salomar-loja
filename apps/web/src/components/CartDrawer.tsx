import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { formatPrice } from "../data/catalog";
import { getAccessToken } from "../lib/auth-api";
import { calculateShipping } from "../lib/shipping-api";
import { validateCartStock } from "../lib/validate-cart-stock";
import { useCart } from "../state/store";
import { LoginForm } from "./LoginForm";

export function CartDrawer() {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { items, isOpen, subtotal, setOpen, setQuantity, removeItem, replaceItems } =
    useCart();
  const [stockMessage, setStockMessage] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [readyToPay, setReadyToPay] = useState(false);
  const [estimateCep, setEstimateCep] = useState("");
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateText, setEstimateText] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStockMessage(null);
      setShowLogin(false);
      setReadyToPay(false);
      setEstimateError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setEstimateText(null);
    setEstimateError(null);
  }, [items]);

  const handleEstimateFreight = async () => {
    const cep = estimateCep.replace(/\D/g, "");
    if (cep.length !== 8) {
      setEstimateError("Informe um CEP com 8 dígitos");
      setEstimateText(null);
      return;
    }
    setEstimateLoading(true);
    setEstimateError(null);
    try {
      const quote = await calculateShipping(
        cep,
        items.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
        })),
      );
      const cheapest = [...quote.options].sort(
        (a, b) => a.priceCents - b.priceCents,
      )[0];
      if (!cheapest) {
        setEstimateError("Nenhuma opção de frete disponível");
        setEstimateText(null);
        return;
      }
      setEstimateText(
        `A partir de ${formatPrice(cheapest.priceCents / 100)} · até ${cheapest.days} dia${cheapest.days === 1 ? "" : "s"} (${cheapest.serviceName})`,
      );
    } catch (e) {
      setEstimateText(null);
      setEstimateError(
        e instanceof Error ? e.message : "Falha ao estimar frete",
      );
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleCheckout = async () => {
    setStockMessage(null);
    setReadyToPay(false);
    setCheckingOut(true);
    try {
      const result = await validateCartStock(items);
      const adjustmentText = result.problems
        .map((problem) => {
          if (problem.reason === "unavailable") {
            return `${problem.name} esgotou e foi removido`;
          }
          return `${problem.name}: quantidade ajustada para ${problem.available}`;
        })
        .join(". ");

      if (!result.ok) {
        replaceItems(result.adjusted);
        if (result.adjusted.length === 0) {
          setStockMessage(`${adjustmentText}.`);
          return;
        }
      }

      if (!getAccessToken()) {
        setShowLogin(true);
        setStockMessage(
          result.ok
            ? "Estoque conferido. Entre na conta para finalizar."
            : `${adjustmentText}. Entre na conta para finalizar.`,
        );
        return;
      }

      setReadyToPay(true);
      setStockMessage(
        result.ok
          ? "Estoque confirmado. Pronto para o pagamento."
          : `${adjustmentText}. Pronto para o pagamento.`,
      );
    } catch {
      setStockMessage(
        "Não foi possível validar o estoque agora. Tente de novo em instantes.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

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
          <button
            className="icon-button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar sacola"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag aria-hidden="true" />
            <h3>Sua sacola está leve.</h3>
            <p>Conte-nos a ocasião e encontre uma peça para ela.</p>
            <button
              className="text-link"
              onClick={() => dialogRef.current?.close()}
            >
              Voltar à descoberta
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.productVariantId}>
                  <img
                    src={item.image}
                    alt=""
                    style={{ objectPosition: item.focus }}
                  />
                  <div className="cart-item__details">
                    <h3>{item.name}</h3>
                    <p>
                      {item.color} · Tamanho {item.size}
                    </p>
                    <p>{formatPrice(item.unitPrice)}</p>
                    <div
                      className="quantity-control"
                      aria-label={`Quantidade de ${item.name}`}
                    >
                      <button
                        aria-label="Diminuir quantidade"
                        onClick={() =>
                          setQuantity(item.productVariantId, item.quantity - 1)
                        }
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        aria-label="Aumentar quantidade"
                        onClick={() =>
                          setQuantity(item.productVariantId, item.quantity + 1)
                        }
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
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="cart-summary__freight">
                <label>
                  <span className="visually-hidden">CEP para frete</span>
                  <input
                    value={estimateCep}
                    onChange={(e) => setEstimateCep(e.target.value)}
                    placeholder="CEP"
                    inputMode="numeric"
                    aria-label="CEP para estimar frete"
                  />
                </label>
                <button
                  type="button"
                  className="text-link"
                  disabled={estimateLoading || items.length === 0}
                  onClick={() => void handleEstimateFreight()}
                >
                  {estimateLoading ? "Calculando…" : "Calcular frete"}
                </button>
              </div>
              {estimateText && (
                <p className="cart-summary__freight-result" role="status">
                  {estimateText}
                </p>
              )}
              {estimateError && (
                <p className="cart-summary__freight-error" role="alert">
                  {estimateError}
                </p>
              )}
              {stockMessage && (
                <p className="cart-summary__notice" role="status">
                  {stockMessage}
                </p>
              )}
              {showLogin && (
                <LoginForm
                  onSuccess={() => {
                    setShowLogin(false);
                    setReadyToPay(true);
                    setStockMessage(
                      "Sacola sincronizada. Estoque ok — vá para o checkout.",
                    );
                  }}
                  onCancel={() => setShowLogin(false)}
                />
              )}
              {!showLogin && (
                <button
                  className="primary-action"
                  disabled={checkingOut || items.length === 0}
                  onClick={() => {
                    if (readyToPay) {
                      setOpen(false);
                      navigate("/checkout");
                      return;
                    }
                    void handleCheckout();
                  }}
                >
                  {checkingOut
                    ? "Conferindo estoque…"
                    : readyToPay
                      ? "Ir para o checkout"
                      : "Validar estoque e continuar"}
                </button>
              )}
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
