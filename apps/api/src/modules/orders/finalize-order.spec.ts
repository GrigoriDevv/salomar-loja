import { CheckoutService } from "./checkout.service";
import type { MailService } from "../auth/mail";
import type { MpClient } from "./mp.client";
import type { ShippingService } from "../shipping/shipping.service";
import type { PrismaService } from "../../prisma/prisma.service";

const paidOrder = {
  id: "ckorder00000000abcd1234",
  userId: "u1",
  status: "paid",
  totalCents: 16790,
  shippingCents: 1890,
  shippingRecipient: "Teste Silva",
  shippingStreet: "Av. Paulista",
  shippingNumber: "1000",
  shippingComplement: null,
  shippingDistrict: "Bela Vista",
  shippingCity: "São Paulo",
  shippingState: "SP",
  shippingCep: "01310100",
  user: { name: "Teste", email: "t@ex.com" },
  items: [
    {
      quantity: 1,
      unitPriceCents: 14900,
      productVariant: { size: "M", product: { name: "Camiseta Branca" } },
    },
  ],
};

function makeService(opts: { status: string; mailFails?: boolean }) {
  const tx = {
    order: {
      findUnique: jest.fn().mockResolvedValue({
        id: paidOrder.id,
        userId: "u1",
        status: opts.status,
        items: [{ productVariantId: "v1", quantity: 1 }],
        payments: [{ status: "approved" }],
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    productVariant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    cart: { findUnique: jest.fn().mockResolvedValue(null) },
    cartItem: { deleteMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    order: { findUnique: jest.fn().mockResolvedValue(paidOrder) },
  } as unknown as PrismaService;

  const send = opts.mailFails
    ? jest.fn().mockRejectedValue(new Error("Resend fora"))
    : jest.fn().mockResolvedValue(undefined);
  const mail = {
    sendOrderPaid: send,
    sendNewOrderAlert: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailService;

  const service = new CheckoutService(
    prisma,
    {} as MpClient,
    {} as ShippingService,
    mail,
  );
  return { service, mail, tx };
}

describe("CheckoutService.finalizeOrder", () => {
  it("envia confirmação ao cliente e aviso à loja quando o pedido vira pago", async () => {
    const { service, mail, tx } = makeService({ status: "pending" });
    await service.finalizeOrder(paidOrder.id);

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: paidOrder.id },
      data: { status: "paid" },
    });
    expect(mail.sendOrderPaid).toHaveBeenCalledWith(
      "t@ex.com",
      expect.objectContaining({
        customerName: "Teste Silva",
        totalCents: 16790,
        shippingAddress: expect.stringContaining("Av. Paulista, 1000"),
      }),
    );
    expect(mail.sendNewOrderAlert).toHaveBeenCalledTimes(1);
  });

  it("não reenvia e-mails se o pedido já estava pago (webhook repetido)", async () => {
    const { service, mail } = makeService({ status: "paid" });
    await service.finalizeOrder(paidOrder.id);
    expect(mail.sendOrderPaid).not.toHaveBeenCalled();
    expect(mail.sendNewOrderAlert).not.toHaveBeenCalled();
  });

  it("webhook repetido de pedido já enviado não baixa estoque de novo", async () => {
    const { service, mail, tx } = makeService({ status: "shipped" });
    await service.finalizeOrder(paidOrder.id);
    expect(tx.productVariant.updateMany).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(mail.sendOrderPaid).not.toHaveBeenCalled();
  });

  it("falha no envio de e-mail não derruba a confirmação do pagamento", async () => {
    const { service } = makeService({ status: "pending", mailFails: true });
    await expect(service.finalizeOrder(paidOrder.id)).resolves.toBeUndefined();
  });
});
