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
