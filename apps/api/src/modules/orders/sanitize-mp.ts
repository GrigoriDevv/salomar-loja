export type PixData = {
  qrCode: string;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: string | null;
};

/** Dados do Pix (copia e cola + QR) devolvidos pelo MP em point_of_interaction. */
export function extractPixData(payload: unknown): PixData | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const poi = p.point_of_interaction as Record<string, unknown> | undefined;
  const tx = poi?.transaction_data as Record<string, unknown> | undefined;
  const qrCode = typeof tx?.qr_code === "string" ? tx.qr_code : null;
  if (!qrCode) {
    // Formato já sanitizado (salvo em Payment.rawPayload).
    const saved = p.pix as Partial<PixData> | null | undefined;
    return saved?.qrCode
      ? {
          qrCode: saved.qrCode,
          qrCodeBase64: saved.qrCodeBase64 ?? null,
          ticketUrl: saved.ticketUrl ?? null,
          expiresAt: saved.expiresAt ?? null,
        }
      : null;
  }
  return {
    qrCode,
    qrCodeBase64:
      typeof tx?.qr_code_base64 === "string" ? tx.qr_code_base64 : null,
    ticketUrl: typeof tx?.ticket_url === "string" ? tx.ticket_url : null,
    expiresAt:
      typeof p.date_of_expiration === "string" ? p.date_of_expiration : null,
  };
}

export function sanitizeMpPayload(payload: Record<string, unknown>) {
  return {
    id: payload.id ?? null,
    status: payload.status ?? null,
    status_detail: payload.status_detail ?? null,
    transaction_amount: payload.transaction_amount ?? null,
    payment_method: payload.payment_method ?? null,
    installments: payload.installments ?? null,
    external_reference: payload.external_reference ?? null,
    date_approved: payload.date_approved ?? null,
    pix: extractPixData(payload),
  };
}

export type AppPaymentStatus = "pending" | "approved" | "rejected" | "refunded";

export function mapMpStatus(status: string | undefined): AppPaymentStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}
