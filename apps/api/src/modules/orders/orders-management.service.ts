import { Injectable, NotFoundException } from "@nestjs/common";
import type { OrderStatus, Prisma } from "../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../auth/auth-user.type";
import { recordAccessLog } from "../audit/access-log.store";
import type { ListOrdersDto } from "./dto/list-orders.dto";
import type { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      productVariant: {
        include: {
          product: {
            select: { id: true, slug: true, name: true, image: true },
          },
        },
      },
    },
  },
  payments: {
    select: {
      id: true,
      status: true,
      amountCents: true,
      transactionId: true,
      provider: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

@Injectable()
export class OrdersManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((order) => this.toListItem(order)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }
    return this.toDetail(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actor: AuthUser) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }

    const from = order.status;
    const to = dto.status as OrderStatus;

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: to },
      include: orderInclude,
    });

    await recordAccessLog(this.prisma, {
      actor: actor.email,
      action: "order.status_update",
      resource: `order:${id}`,
      detail: {
        from,
        to,
        note: dto.note ?? null,
        actorId: actor.id,
        role: actor.role,
      },
    });

    return this.toDetail(updated);
  }

  private toListItem(order: OrderWithRelations) {
    return {
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      total: order.totalCents / 100,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : null,
      itemsCount: order.items.length,
      paymentStatus: order.payments[0]?.status ?? null,
    };
  }

  private toDetail(order: OrderWithRelations) {
    return {
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      total: order.totalCents / 100,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariant.id,
        productId: item.productVariant.product.slug,
        name: item.productVariant.product.name,
        size: item.productVariant.size,
        color: item.productVariant.color,
        image: item.productVariant.product.image,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents / 100,
        lineTotal: (item.unitPriceCents * item.quantity) / 100,
      })),
      payments: order.payments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        amount: payment.amountCents / 100,
        transactionId: payment.transactionId,
        provider: payment.provider,
        createdAt: payment.createdAt,
      })),
    };
  }
}
