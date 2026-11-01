// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PixPayment } from "./PixPayment";

const pix = {
  qrCode: "00020126580014br.gov.bcb.pix-exemplo",
  qrCodeBase64: "iVBORw0KGgo=",
  ticketUrl: "https://www.mercadopago.com.br/payments/1/ticket",
  expiresAt: "2026-11-02T20:00:00.000-03:00",
};

afterEach(cleanup);

describe("PixPayment", () => {
  it("mostra o QR code, o copia e cola e o link do Mercado Pago", () => {
    render(<PixPayment pix={pix} />);
    const img = screen.getByAltText("QR code do Pix para pagar o pedido");
    expect(img.getAttribute("src")).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(
      (screen.getByLabelText("Pix copia e cola") as HTMLTextAreaElement).value,
    ).toBe(pix.qrCode);
    expect(
      screen.getByRole("link", { name: "Abrir no Mercado Pago" }),
    ).toBeTruthy();
  });

  it("copia o código para a área de transferência", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<PixPayment pix={{ ...pix, qrCodeBase64: null }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar código Pix" }));
    expect(writeText).toHaveBeenCalledWith(pix.qrCode);
    expect(
      await screen.findByRole("button", { name: "Código copiado" }),
    ).toBeTruthy();
  });
});
