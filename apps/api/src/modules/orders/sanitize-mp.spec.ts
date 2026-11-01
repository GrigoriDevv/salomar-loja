import { extractPixData, sanitizeMpPayload } from "./sanitize-mp";

const mpPix = {
  id: 1,
  status: "pending",
  date_of_expiration: "2026-11-02T20:00:00.000-03:00",
  point_of_interaction: {
    transaction_data: {
      qr_code: "00020126580014br.gov.bcb.pix...",
      qr_code_base64: "iVBORw0KGgo=",
      ticket_url: "https://www.mercadopago.com.br/payments/1/ticket",
    },
  },
};

describe("extractPixData", () => {
  it("lê o copia e cola e o QR da resposta do Mercado Pago", () => {
    expect(extractPixData(mpPix)).toEqual({
      qrCode: "00020126580014br.gov.bcb.pix...",
      qrCodeBase64: "iVBORw0KGgo=",
      ticketUrl: "https://www.mercadopago.com.br/payments/1/ticket",
      expiresAt: "2026-11-02T20:00:00.000-03:00",
    });
  });

  it("lê de volta o formato salvo em Payment.rawPayload", () => {
    const saved = sanitizeMpPayload(mpPix);
    expect(extractPixData(saved)).toEqual(extractPixData(mpPix));
  });

  it("retorna null para pagamento com cartão", () => {
    expect(extractPixData({ id: 2, status: "approved" })).toBeNull();
    expect(sanitizeMpPayload({ id: 2, status: "approved" }).pix).toBeNull();
  });
});
