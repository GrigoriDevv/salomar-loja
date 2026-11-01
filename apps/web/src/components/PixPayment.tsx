import { useState } from "react";
import type { PixData } from "../lib/checkout-api";

type Props = { pix: PixData };

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PixPayment({ pix }: Props) {
  const [copied, setCopied] = useState(false);
  const expiry = formatExpiry(pix.expiresAt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="checkout-pix" aria-labelledby="checkout-pix-title">
      <h3 id="checkout-pix-title">Pague com Pix</h3>
      <p className="meta">
        Abra o app do seu banco, escolha pagar com Pix e escaneie o QR code ou
        cole o código abaixo. Esta tela atualiza sozinha quando o pagamento for
        confirmado.
      </p>
      {pix.qrCodeBase64 && (
        <img
          className="checkout-pix__qr"
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR code do Pix para pagar o pedido"
          width={220}
          height={220}
        />
      )}
      <label className="checkout-pix__code">
        <span>Pix copia e cola</span>
        <textarea
          readOnly
          rows={3}
          value={pix.qrCode}
          onFocus={(e) => e.currentTarget.select()}
        />
      </label>
      <button
        type="button"
        className="primary-action"
        onClick={() => void copy()}
      >
        {copied ? "Código copiado" : "Copiar código Pix"}
      </button>
      <p className="meta" role="status" aria-live="polite">
        {copied ? "Código copiado. Cole no app do banco." : ""}
      </p>
      {expiry && <p className="meta">Válido até {expiry}.</p>}
      {pix.ticketUrl && (
        <a
          className="text-link"
          href={pix.ticketUrl}
          target="_blank"
          rel="noreferrer"
        >
          Abrir no Mercado Pago
        </a>
      )}
    </section>
  );
}
