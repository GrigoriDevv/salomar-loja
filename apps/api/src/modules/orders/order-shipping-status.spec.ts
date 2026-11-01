import { BadRequestException } from "@nestjs/common";
import { OrdersManagementService } from "./orders-management.service";
import type { MailService } from "../auth/mail";
import type { PrismaService } from "../../prisma/prisma.service";
import { OrderStatusUpdate } from "./dto/update-order-status.dto";

jest.mock("../audit/access-log.store", () => ({
  recordAccessLog: jest.fn().mockResolvedValue(undefined),
}));

const admin = {
  id: "a1",
  email: "admin@salomar.com.br",
  role: "admin",
} as never;

function makeService(current: {
  status: string;
  trackingCode?: string | null;
}) {
  const update = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      id: "ckorder00000000abcd1234",
      status: data.status,
      totalCents: 100,
      currency: "BRL",
      shippingCents: 0,
      trackingCode: data.trackingCode ?? current.trackingCode ?? null,
      shippingRecipient: "Teste Silva",
      user: { id: "u1", name: "Teste", email: "t@ex.com" },
      items: [],
      payments: [],
    }),
  );
  const prisma = {
    order: {
      findUnique: jest.fn().mockResolvedValue({
        id: "ckorder00000000abcd1234",
        trackingCode: null,
        ...current,
      }),
      update,
    },
  } as unknown as PrismaService;
  const mail = {
    sendOrderShipped: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailService;
  return { service: new OrdersManagementService(prisma, mail), update, mail };
}

describe("OrdersManagementService envio", () => {
  it("marca como enviado com rastreio e avisa o cliente", async () => {
    const { service, update, mail } = makeService({ status: "paid" });
    await service.updateStatus(
      "o1",
      { status: OrderStatusUpdate.shipped, trackingCode: " aa123456789br " },
      admin,
    );
    const data = update.mock.calls[0][0].data;
    expect(data.status).toBe("shipped");
    expect(data.trackingCode).toBe("AA123456789BR");
    expect(data.shippedAt).toBeInstanceOf(Date);
    expect(mail.sendOrderShipped).toHaveBeenCalledWith(
      "t@ex.com",
      expect.objectContaining({ trackingCode: "AA123456789BR" }),
    );
  });

  it("exige código de rastreio", async () => {
    const { service } = makeService({ status: "paid" });
    await expect(
      service.updateStatus("o1", { status: OrderStatusUpdate.shipped }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("não envia pedido que ainda não foi pago", async () => {
    const { service } = makeService({ status: "pending" });
    await expect(
      service.updateStatus(
        "o1",
        { status: OrderStatusUpdate.shipped, trackingCode: "AA123456789BR" },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("só marca como entregue depois de enviado", async () => {
    const { service, update } = makeService({ status: "paid" });
    await expect(
      service.updateStatus(
        "o1",
        { status: OrderStatusUpdate.delivered },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const shipped = makeService({
      status: "shipped",
      trackingCode: "AA123456789BR",
    });
    await shipped.service.updateStatus(
      "o1",
      { status: OrderStatusUpdate.delivered },
      admin,
    );
    expect(shipped.update.mock.calls[0][0].data.deliveredAt).toBeInstanceOf(
      Date,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("não reenvia o e-mail se o rastreio não mudou", async () => {
    const { service, mail } = makeService({
      status: "shipped",
      trackingCode: "AA123456789BR",
    });
    await service.updateStatus(
      "o1",
      { status: OrderStatusUpdate.shipped, trackingCode: "AA123456789BR" },
      admin,
    );
    expect(mail.sendOrderShipped).not.toHaveBeenCalled();
  });
});
