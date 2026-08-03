import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";

type VariantRow = {
  id: string;
  size: string;
  color: string;
  stock: number;
  active: boolean;
};

export type CatalogListQuery = {
  page: number;
  limit: number;
  intent?: string;
  category?: string;
  size?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, active: true },
      include: {
        category: true,
        variants: { where: { active: true }, orderBy: { size: "asc" } },
      },
    });
    return product ? this.toClient(product) : null;
  }

  async findAll(query: CatalogListQuery) {
    const { page, limit } = query;
    const where = this.buildWhere(query);

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { where: { active: true }, orderBy: { size: "asc" } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: products.map((product) => this.toClient(product)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  private buildWhere(query: CatalogListQuery): Prisma.ProductWhereInput {
    const variantFilter: Prisma.ProductVariantWhereInput = { active: true };
    if (query.size) variantFilter.size = query.size;
    if (query.color) variantFilter.color = query.color;

    const priceCents: Prisma.IntFilter = {};
    if (query.priceMin !== undefined) {
      priceCents.gte = Math.round(query.priceMin * 100);
    }
    if (query.priceMax !== undefined) {
      priceCents.lte = Math.round(query.priceMax * 100);
    }

    return {
      active: true,
      ...(query.intent ? { intents: { has: query.intent } } : {}),
      ...(query.category ? { category: { name: query.category } } : {}),
      ...(query.size || query.color
        ? { variants: { some: variantFilter } }
        : {}),
      ...(Object.keys(priceCents).length > 0 ? { priceCents } : {}),
    };
  }

  private toClient(product: {
    id: string;
    slug: string;
    name: string;
    subtitle: string;
    category: { name: string };
    material: string;
    fit: string;
    tone: string;
    image: string;
    alt: string;
    focus: string;
    intents: string[];
    priceCents: number;
    variants: VariantRow[];
  }) {
    const variants = product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    }));
    const sizes = [...new Set(variants.map((variant) => variant.size))];
    const stock = variants.reduce((sum, variant) => sum + variant.stock, 0);

    return {
      id: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      price: product.priceCents / 100,
      stock,
      inStock: stock > 0,
      category: product.category.name,
      material: product.material,
      fit: product.fit,
      sizes,
      image: product.image,
      alt: product.alt,
      intents: product.intents,
      tone: product.tone,
      focus: product.focus,
      variants,
    };
  }
}
