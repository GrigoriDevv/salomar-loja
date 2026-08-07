import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { PaymentBrick } from "../components/PaymentBrick";
import {
  PaymentMethodPicker,
  type CheckoutPayMethod,
} from "../components/PaymentMethodPicker";
import { ShippingForm } from "../components/ShippingForm";
import { formatPrice } from "../data/catalog";
import { getAccessToken, getUserEmail } from "../lib/auth-api";
import {
  pollMyOrderStatus,
  postCheckout,
  type ShippingData,
} from "../lib/checkout-api";
import { useCart } from "../state/store";

type Step = "shipping" | "method" | "pay" | "confirm";

const METHOD_LABEL: Record<CheckoutPayMethod, string> = {
  card: "Cartão",
  pix: "Pix",
  boleto: "Boleto",
};

function statusLabel(orderStatus: string, paymentStatus: string): string {
  if (orderStatus === "paid" || paymentStatus === "approved") {
    return "Pagamento aprovado";
  }
  if (
    orderStatus === "failed" ||
    orderStatus === "canceled" ||
    paymentStatus === "rejected"
  ) {
    return "Pagamento recusado";
  }
  return "Aguardando pagamento";
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, replaceItems } = useCart();
  const [step, setStep] = useState<Step>("shipping");
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [method, setMethod] = useState<CheckoutPayMethod | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [polling, setPolling] = useState(false);

  const amountReais = useMemo(() => subtotal, [subtotal]);
  const payerEmail = getUserEmail() ?? "cliente@salomar.local";

  useEffect(() => {
    if (step !== "confirm" || !orderId || !polling) return;

    let cancelled = false;
    void (async () => {
      const result = await pollMyOrderStatus(orderId);
      if (cancelled) return;
      setOrderStatus(result.orderStatus);
      setPaymentStatus(result.paymentStatus);
      setPolling(false);
      if (
        result.orderStatus === "paid" ||
        result.paymentStatus === "approved"
      ) {
        replaceItems([]);
        setMessage("Pagamento aprovado. Obrigado pela compra.");
      } else if (
        result.orderStatus === "failed" ||
        result.paymentStatus === "rejected"
      ) {
        setMessage("Pagamento recusado. Você pode tentar novamente.");
      } else {
        setMessage(
          "Ainda estamos confirmando o pagamento. Atualize em instantes.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, orderId, polling, replaceItems]);

  if (!getAccessToken()) {
    return (
      <main className="checkout-page">
        <h1>Checkout</h1>
        <p>Entre na conta pela sacola para continuar.</p>
        <Link to="/" className="text-link">
          Voltar à loja
        </Link>
      </main>
    );
  }

  if (items.length === 0 && step !== "confirm") {
    return (
      <main className="checkout-page">
        <h1>Checkout</h1>
        <p>Sua sacola está vazia.</p>
        <Link to="/" className="text-link">
          Continuar comprando
        </Link>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <p className="meta">Finalizar compra</p>
      <h1>Checkout</h1>
      {items.length > 0 && step !== "confirm" && (
        <p className="meta">
          {items.length} item(ns) · {formatPrice(subtotal)}
        </p>
      )}

      {step === "shipping" && (
        <ShippingForm
          disabled={busy}
          onSubmit={(data) => {
            setShipping(data);
            setStep("method");
          }}
        />
      )}

      {step === "method" && shipping && (
        <>
          <p>
            Entrega: {shipping.fullName} — {shipping.street}, {shipping.number}{" "}
            · {shipping.city}/{shipping.state}
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => setStep("shipping")}
            disabled={busy}
          >
            Editar endereço
          </button>
          <PaymentMethodPicker
            selected={method}
            disabled={busy}
            onSelect={(next) => {
              setMethod(next);
              setStep("pay");
            }}
          />
        </>
      )}

      {step === "pay" && shipping && method && (
        <section className="checkout-pay">
          <p>
            {METHOD_LABEL[method]} · Entrega em {shipping.city}/{shipping.state}
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => setStep("method")}
            disabled={busy}
          >
            Trocar forma de pagamento
          </button>
          <PaymentBrick
            amountReais={amountReais}
            payerEmail={payerEmail}
            method={method}
            onPay={async (pay) => {
              setBusy(true);
              setMessage(null);
              try {
                const result = await postCheckout({ ...pay, shipping });
                setOrderId(result.orderId);
                setTotalCents(result.totalCents);
                setPaymentStatus(result.paymentStatus);
                setOrderStatus(
                  result.paymentStatus === "approved"
                    ? "paid"
                    : result.paymentStatus === "rejected"
                      ? "failed"
                      : "pending",
                );
                setStep("confirm");
                if (result.paymentStatus === "approved") {
                  replaceItems([]);
                  setMessage("Pagamento aprovado. Obrigado pela compra.");
                  setPolling(false);
                } else if (result.paymentStatus === "rejected") {
                  setMessage("Pagamento recusado. Tente outra forma.");
                  setPolling(false);
                } else {
                  setMessage("Aguardando confirmação do pagamento…");
                  setPolling(true);
                }
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Erro no checkout",
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </section>
      )}

      {step === "confirm" && orderId && (
        <section className="checkout-confirm" aria-live="polite">
          <h2>Confirmação do pedido</h2>
          <dl className="checkout-confirm__details">
            <div>
              <dt>Pedido</dt>
              <dd>{orderId}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                {formatPrice(
                  totalCents != null ? totalCents / 100 : amountReais,
                )}
              </dd>
            </div>
            {method && (
              <div>
                <dt>Pagamento</dt>
                <dd>{METHOD_LABEL[method]}</dd>
              </div>
            )}
            {shipping && (
              <div>
                <dt>Entrega</dt>
                <dd>
                  {shipping.fullName} — {shipping.street}, {shipping.number}
                  {shipping.complement ? `, ${shipping.complement}` : ""} ·{" "}
                  {shipping.city}/{shipping.state} · CEP {shipping.cep}
                </dd>
              </div>
            )}
            <div>
              <dt>Status</dt>
              <dd>
                <span
                  className={`checkout-confirm__badge checkout-confirm__badge--${
                    orderStatus === "paid" || paymentStatus === "approved"
                      ? "ok"
                      : orderStatus === "failed" ||
                          paymentStatus === "rejected"
                        ? "fail"
                        : "pending"
                  }`}
                >
                  {statusLabel(orderStatus, paymentStatus)}
                  {polling ? " (atualizando…)" : ""}
                </span>
              </dd>
            </div>
          </dl>
          {message && <p role="status">{message}</p>}
          <button
            type="button"
            className="primary-action"
            onClick={() => navigate("/")}
          >
            Voltar à loja
          </button>
        </section>
      )}

      {message && step !== "confirm" && (
        <p className="checkout-page__notice" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
