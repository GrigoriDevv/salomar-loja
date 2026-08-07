import { useEffect, useMemo, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import type { CheckoutPayMethod } from "./PaymentMethodPicker";
import type { CheckoutPayload } from "../lib/checkout-api";

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY?.trim();

type Props = {
  amountReais: number;
  payerEmail: string;
  method: CheckoutPayMethod;
  onPay: (data: CheckoutPayload) => Promise<void>;
};

type BrickFormData = {
  paymentType?: string;
  formData?: {
    token?: string;
    payment_method_id?: string;
    installments?: number;
    issuer_id?: string;
    payer?: {
      email?: string;
      identification?: { type?: string; number?: string };
    };
  };
  token?: string;
  payment_method_id?: string;
  installments?: number;
  issuer_id?: string;
};

function paymentMethodsFor(method: CheckoutPayMethod) {
  if (method === "pix") {
    return { bankTransfer: "all" as const, maxInstallments: 1 };
  }
  if (method === "boleto") {
    return { ticket: "all" as const, maxInstallments: 1 };
  }
  return {
    creditCard: "all" as const,
    debitCard: "all" as const,
    maxInstallments: 12,
  };
}

function normalizeSubmit(data: BrickFormData): CheckoutPayload {
  const nested = data.formData;
  const paymentMethodId = String(
    nested?.payment_method_id ?? data.payment_method_id ?? "",
  );
  const token = nested?.token ?? data.token;
  const installments = nested?.installments ?? data.installments ?? 1;
  const issueId = nested?.issuer_id ?? data.issuer_id;
  const identification = nested?.payer?.identification;

  let payerDocument: CheckoutPayload["payerDocument"];
  if (identification?.type && identification.number) {
    const type = identification.type.toUpperCase();
    if (type === "CPF" || type === "CNPJ") {
      payerDocument = { type, number: identification.number };
    }
  }

  return {
    token: token || undefined,
    paymentMethodId,
    installments,
    issueId: issueId || undefined,
    payerDocument,
  };
}

export function PaymentBrick({
  amountReais,
  payerEmail,
  method,
  onPay,
}: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customization = useMemo(
    () => ({ paymentMethods: paymentMethodsFor(method) }),
    [method],
  );

  useEffect(() => {
    if (!publicKey) {
      setError("VITE_MP_PUBLIC_KEY não configurada");
      return;
    }
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setReady(true);
  }, []);

  if (error) {
    return (
      <p className="checkout-payment__error" role="alert">
        {error}
      </p>
    );
  }

  if (!ready) {
    return <p className="meta">Carregando pagamento…</p>;
  }

  return (
    <div className="checkout-payment">
      <h2>Pagamento</h2>
      <p className="meta">
        Checkout tokenizado pelo Mercado Pago — dados sensíveis não passam pelo
        Salomar.
      </p>
      <Payment
        key={method}
        initialization={{
          amount: amountReais,
          payer: { email: payerEmail },
        }}
        customization={customization}
        onSubmit={async (formData: BrickFormData) => {
          const payload = normalizeSubmit(formData);
          if (!payload.paymentMethodId) {
            setError("Método de pagamento inválido");
            return;
          }
          await onPay(payload);
        }}
        onError={() => setError("Não foi possível processar o pagamento")}
      />
    </div>
  );
}
