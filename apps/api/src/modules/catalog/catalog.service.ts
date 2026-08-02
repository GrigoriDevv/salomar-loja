import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type VariantRow = {
  size: string;
  color: string;
  stock: number;
  active: boolean;
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

  async findAll(query: { page: number; limit: number; intent?: string }) {
    const { page, limit, intent } = query;
    const where = {
      active: true,
      ...(intent ? { intents: { has: intent } } : {}),
    };

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
