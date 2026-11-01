import { ServiceUnavailableException } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import type { MpClient } from "./mp.client";
import type { ShippingService } from "../shipping/shipping.service";
import type { PrismaService } from "../../prisma/prisma.service";
import type { CheckoutDto } from "./dto/checkout.dto";
import type { MailService } from "../auth/mail";

jest.mock("./payment-idempotency", () => ({
  insertPaymentIdempotent: jest.fn().mockResolvedValue(undefined),
}));

const dto: CheckoutDto = {
  paymentMethodId: "pix",
  shipping: {
    fullName: " Teste Silva ",
    cep: "01310100",
    street: " Av. Paulista ",
    number: "1000",
    complement: "  ",
    district: "Bela Vista",
    city: "São Paulo",
    state: "sp",
  },
  shippingServiceCode: "pac",
  shippingPriceCents: 1890,
};

function makeService(createPayment: jest.Mock) {
  const orderCreate = jest.fn().mockResolvedValue({ id: "order-1" });
  const orderUpdate = jest.fn().mockResolvedValue({});
  const prisma = {
    cart: {
      findUnique: jest.fn().mockResolvedValue({
        items: [
          {
            productVariantId: "v1",
            quantity: 1,
            productVariant: {
              id: "v1",
              active: true,
              stock: 5,
              product: { active: true, priceCents: 14900 },
            },
          },
        ],
      }),
    },
    order: { update: orderUpdate },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      fn({ order: { create: orderCreate } }),
    ),
  } as unknown as PrismaService;

  const shipping = {
    quoteForCart: jest.fn().mockReturnValue({
      cep: "01310100",
      options: [{ serviceCode: "pac", priceCents: 1890 }],
    }),
  } as unknown as ShippingService;

  const mp = { createPayment } as unknown as MpClient;
  return {
    service: new CheckoutService(prisma, mp, shipping, {} as MailService),
    orderCreate,
    orderUpdate,
  };
}

describe("CheckoutService.checkout", () => {
  it("grava o endereço completo de entrega no pedido", async () => {
    const { service, orderCreate } = makeService(
      jest.fn().mockResolvedValue({ id: 123, status: "pending" }),
    );

    await service.checkout("user-1", "t@ex.com", dto);

    expect(orderCreate.mock.calls[0][0].data).toMatchObject({
      shippingRecipient: "Teste Silva",
      shippingStreet: "Av. Paulista",
      shippingNumber: "1000",
      shippingComplement: null,
      shippingDistrict: "Bela Vista",
      shippingCep: "01310100",
      shippingCity: "São Paulo",
      shippingState: "SP",
      totalCents: 14900 + 1890,
    });
  });

  it("marca o pedido como failed se o Mercado Pago não criar o pagamento", async () => {
    const { service, orderUpdate } = makeService(
      jest
        .fn()
        .mockRejectedValue(new ServiceUnavailableException("MP fora do ar")),
    );

    await expect(
      service.checkout("user-1", "t@ex.com", dto),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: "failed" },
    });
  });
});
