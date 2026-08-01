import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch {
      throw new ConflictException("Slug de categoria já existe");
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.category.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.category.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException("Categoria não encontrada");
    }
  }
}
