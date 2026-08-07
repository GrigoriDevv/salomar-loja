export const MP_PAYMENT_WEBHOOKS_QUEUE = "mp-payment-webhooks";

export type MpPaymentWebhookJob = {
  messageId: string;
  paymentId: string;
  payload: Record<string, unknown>;
  traceId: string;
  failedWebhookId?: string;
};
