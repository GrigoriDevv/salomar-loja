import { ConfigService } from "@nestjs/config";
import { MailService, orderSummary, shortOrderId } from "./mail";

const order = {
  id: "ckorder00000000abcd1234",
  customerName: "Teste",
  totalCents: 16790,
  shippingCents: 1890,
  items: [
    { name: "Camiseta Branca", size: "M", quantity: 1, unitPriceCents: 14900 },
  ],
  shippingAddress: "Av. Paulista, 1000 · São Paulo/SP",
};

describe("order e-mails", () => {
  afterEach(() => jest.restoreAllMocks());

  it("resume itens, frete, total e endereço", () => {
    const text = orderSummary(order);
    expect(shortOrderId(order.id)).toBe("ABCD1234");
    expect(text).toContain("Pedido ABCD1234");
    expect(text).toContain("1x Camiseta Branca (M)");
    expect(text).toMatch(/Total: R\$\s?167,90/);
    expect(text).toContain("Entrega: Av. Paulista, 1000");
  });

  it("não envia aviso à loja sem STORE_NOTIFY_EMAIL", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const mail = new MailService(new ConfigService({ RESEND_API_KEY: "re_x" }));
    await mail.sendNewOrderAlert({ ...order, customerEmail: "t@ex.com" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("envia aviso para cada e-mail de STORE_NOTIFY_EMAIL", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const mail = new MailService(
      new ConfigService({
        RESEND_API_KEY: "re_x",
        STORE_NOTIFY_EMAIL: "loja@salomar.com.br, dono@salomar.com.br",
      }),
    );
    await mail.sendNewOrderAlert({ ...order, customerEmail: "t@ex.com" });
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.to).toEqual(["loja@salomar.com.br", "dono@salomar.com.br"]);
    expect(body.subject).toContain("Venda nova: pedido ABCD1234");
  });
});
