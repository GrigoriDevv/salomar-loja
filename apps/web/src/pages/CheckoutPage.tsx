import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { PaymentBrick } from "../components/PaymentBrick";
import { ShippingForm } from "../components/ShippingForm";
import { formatPrice } from "../data/catalog";
import { getAccessToken, getUserEmail } from "../lib/auth-api";
import {
  postCheckout,
  type ShippingData,
} from "../lib/checkout-api";
import { useCart } from "../state/store";

type Step = "shipping" | "pay" | "status";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, replaceItems } = useCart();
  const [step, setStep] = useState<Step>("shipping");
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amountReais = useMemo(() => subtotal, [subtotal]);
  const payerEmail = getUserEmail() ?? "cliente@salomar.local";

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

  if (items.length === 0 && step !== "status") {
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
      {items.length > 0 && (
        <p className="meta">
          {items.length} item(ns) · {formatPrice(subtotal)}
        </p>
      )}

      {step === "shipping" && (
        <ShippingForm
          disabled={busy}
          onSubmit={(data) => {
            setShipping(data);
            setStep("pay");
          }}
        />
      )}

      {step === "pay" && shipping && (
        <section className="checkout-pay">
          <p>
            Entrega: {shipping.fullName} — {shipping.street}, {shipping.number}
            {shipping.complement ? `, ${shipping.complement}` : ""} ·{" "}
            {shipping.city}/{shipping.state} · CEP {shipping.cep}
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => setStep("shipping")}
            disabled={busy}
          >
            Editar endereço
          </button>
          <PaymentBrick
            amountReais={amountReais}
            payerEmail={payerEmail}
            onPay={async (pay) => {
              setBusy(true);
              setMessage(null);
              try {
                const result = await postCheckout({ ...pay, shipping });
                setStep("status");
                if (result.paymentStatus === "approved") {
                  replaceItems([]);
                  setMessage("Pagamento aprovado. Obrigado pela compra.");
                  return;
                }
                if (result.paymentStatus === "rejected") {
                  setMessage("Pagamento recusado. Tente outro cartão.");
                  return;
                }
                setMessage(
                  "Pagamento em processamento. Você receberá a confirmação em breve.",
                );
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Erro no checkout",
                );
                setStep("pay");
              } finally {
                setBusy(false);
              }
            }}
          />
        </section>
      )}

      {step === "status" && (
        <section className="checkout-status">
          <h2>Status</h2>
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

      {message && step !== "status" && (
        <p className="checkout-page__notice" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
