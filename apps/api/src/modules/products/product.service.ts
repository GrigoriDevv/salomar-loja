import {
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
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategory(dto.categoryId);
    try {
      return await this.prisma.product.create({
        data: dto,
        include: { category: true },
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
    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
        include: { category: true },
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
      include: { category: true },
    });
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
