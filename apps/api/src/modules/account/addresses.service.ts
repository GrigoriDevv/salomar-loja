import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateAddressDto,
  UpdateAddressDto,
} from "./dto/address.dto";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const isDefault = dto.isDefault ?? false;
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label?.trim() || null,
        fullName: dto.fullName.trim(),
        cep: dto.cep.replace(/\D/g, ""),
        street: dto.street.trim(),
        number: dto.number.trim(),
        complement: dto.complement?.trim() || null,
        district: dto.district.trim(),
        city: dto.city.trim(),
        state: dto.state.trim().toUpperCase().slice(0, 2),
        isDefault,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException("Endereço não encontrado");
    }

    if (dto.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Nada para atualizar");
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        label:
          dto.label !== undefined ? dto.label.trim() || null : undefined,
        fullName: dto.fullName?.trim(),
        cep: dto.cep ? dto.cep.replace(/\D/g, "") : undefined,
        street: dto.street?.trim(),
        number: dto.number?.trim(),
        complement:
          dto.complement !== undefined
            ? dto.complement.trim() || null
            : undefined,
        district: dto.district?.trim(),
        city: dto.city?.trim(),
        state: dto.state
          ? dto.state.trim().toUpperCase().slice(0, 2)
          : undefined,
        isDefault: dto.isDefault,
      },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException("Endereço não encontrado");
    }
    await this.prisma.address.delete({ where: { id } });
    return { ok: true };
  }
}
