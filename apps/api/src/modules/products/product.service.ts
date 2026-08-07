import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategory(dto.categoryId);
    const variants = this.resolveVariants(dto);

    const { sizes: _sizes, stock: _stock, variants: _variants, ...productData } =
      dto;
    void _sizes;
    void _stock;
    void _variants;

    try {
      return await this.prisma.product.create({
        data: {
          ...productData,
          variants: {
            create: variants.map((variant) => ({
              ...variant,
              categoryId: dto.categoryId,
            })),
          },
        },
        include: { category: true, variants: true },
      });
    } catch {
      throw new ConflictException("Slug de produto já existe");
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);
    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }

    const existing = await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });
    const categoryId = dto.categoryId ?? existing.categoryId;
    const hasVariantInput =
      dto.variants !== undefined ||
      dto.sizes !== undefined ||
      dto.stock !== undefined;

    const { sizes: _sizes, stock: _stock, variants: _variants, ...productData } =
      dto;
    void _sizes;
    void _stock;
    void _variants;

    try {
      if (hasVariantInput) {
        const variants = this.resolveVariants({
          tone: dto.tone ?? existing.tone,
          sizes: dto.sizes,
          stock: dto.stock,
          variants: dto.variants,
        });

        await this.prisma.$transaction([
          this.prisma.productVariant.deleteMany({ where: { productId: id } }),
          this.prisma.product.update({
            where: { id },
            data: {
              ...productData,
              variants: {
                create: variants.map((variant) => ({
                  ...variant,
                  categoryId,
                })),
              },
            },
          }),
        ]);

        return this.findOne(id);
      }

      return await this.prisma.product.update({
        where: { id },
        data: productData,
        include: { category: true, variants: true },
      });
    } catch {
      throw new ConflictException("Slug de produto já existe");
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
      include: { category: true, variants: true },
    });
  }

  async updateVariantStock(
    productId: string,
    variantId: string,
    stock: number,
  ) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException("Variante não encontrada");
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  private resolveVariants(input: {
    tone?: string;
    sizes?: string[];
    stock?: number;
    variants?: { size: string; color: string; stock: number }[];
  }) {
    if (input.variants?.length) {
      return input.variants.map((variant) => ({
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
      }));
    }

    if (input.sizes?.length && input.tone) {
      const stock = input.stock ?? 0;
      return input.sizes.map((size) => ({
        size,
        color: input.tone!,
        stock,
      }));
    }

    throw new BadRequestException(
      "Informe variants[] ou sizes[] + tone para criar o produto",
    );
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException("Produto não encontrado");
    }
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, active: true },
    });
    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }
  }
}
