import { useEffect, useState } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY?.trim();

type CardFormData = {
  token: string;
  payment_method_id: string;
  installments: number;
  issuer_id?: string;
};

type Props = {
  amountReais: number;
  payerEmail: string;
  onPay: (data: {
    token: string;
    paymentMethodId: string;
    installments: number;
    issueId?: string;
  }) => Promise<void>;
};

export function PaymentBrick({ amountReais, payerEmail, onPay }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        Cartão tokenizado — os dados do cartão não passam pelo Salomar.
      </p>
      <CardPayment
        initialization={{
          amount: amountReais,
          payer: { email: payerEmail },
        }}
        onSubmit={async (formData: CardFormData) => {
          await onPay({
            token: formData.token,
            paymentMethodId: formData.payment_method_id,
            installments: formData.installments,
            issueId: formData.issuer_id || undefined,
          });
        }}
        onError={() => setError("Não foi possível processar o cartão")}
      />
    </div>
  );
}
