import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AddCartItemDto } from "./dto/add-cart-item.dto";
import type { MergeCartDto } from "./dto/merge-cart.dto";

const cartInclude = {
  items: {
    include: {
      productVariant: {
        include: { product: true },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    const cart = await this.findOrCreate(userId);
    return this.toClient(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const qty = dto.quantity ?? 1;
    const cart = await this.findOrCreate(userId);
    const variant = await this.requireActiveVariant(dto.productVariantId);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: variant.id,
        },
      },
    });

    const nextQty = (existing?.quantity ?? 0) + qty;
    if (nextQty > variant.stock) {
      throw new ConflictException("Estoque insuficiente");
    }

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: variant.id,
        },
      },
      create: {
        cartId: cart.id,
        productVariantId: variant.id,
        quantity: qty,
      },
      update: { quantity: nextQty },
    });

    return this.getMine(userId);
  }

  async setQuantity(
    userId: string,
    productVariantId: string,
    quantity: number,
  ) {
    const cart = await this.findOrCreate(userId);

    if (quantity === 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productVariantId },
      });
      return this.getMine(userId);
    }

    const variant = await this.requireActiveVariant(productVariantId);
    if (quantity > variant.stock) {
      throw new ConflictException("Estoque insuficiente");
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: { cartId: cart.id, productVariantId },
      },
    });
    if (!existing) {
      throw new NotFoundException("Item não está no carrinho");
    }

    await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    return this.getMine(userId);
  }

  async removeItem(userId: string, productVariantId: string) {
    const cart = await this.findOrCreate(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productVariantId },
    });
    return this.getMine(userId);
  }

  async clear(userId: string) {
    const cart = await this.findOrCreate(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getMine(userId);
  }

  async merge(userId: string, dto: MergeCartDto) {
    const cart = await this.findOrCreate(userId);

    for (const line of dto.items) {
      const variant = await this.requireActiveVariant(line.productVariantId);
      const existing = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: variant.id,
          },
        },
      });

      const nextQty = Math.min(
        (existing?.quantity ?? 0) + line.quantity,
        variant.stock,
      );
      if (nextQty < 1) continue;

      await this.prisma.cartItem.upsert({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: variant.id,
          },
        },
        create: {
          cartId: cart.id,
          productVariantId: variant.id,
          quantity: nextQty,
        },
        update: { quantity: nextQty },
      });
    }

    return this.getMine(userId);
  }

  private async findOrCreate(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
    if (existing) return existing;

    return this.prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
  }

  private async requireActiveVariant(productVariantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: productVariantId,
        active: true,
        product: { active: true },
      },
    });
    if (!variant) {
      throw new NotFoundException("Variante não encontrada");
    }
    if (variant.stock < 1) {
      throw new BadRequestException("Variante sem estoque");
    }
    return variant;
  }

  private toClient(cart: Awaited<ReturnType<CartService["findOrCreate"]>>) {
    return {
      id: cart.id,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item) => {
        const v = item.productVariant;
        const p = v.product;
        return {
          productVariantId: v.id,
          quantity: item.quantity,
          productId: p.slug,
          name: p.name,
          size: v.size,
          color: v.color,
          unitPrice: p.priceCents / 100,
          image: p.image,
          focus: p.focus,
          stock: v.stock,
        };
      }),
    };
  }
}
