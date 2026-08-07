import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        anonymizedAt: true,
      },
    });
    if (!user || user.anonymizedAt) {
      throw new UnauthorizedException("Conta indisponível");
    }

    const [addresses, orders, consents] = await Promise.all([
      this.prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              unitPriceCents: true,
              productVariantId: true,
            },
          },
          payments: {
            select: {
              status: true,
              amountCents: true,
              provider: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.consent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          category: true,
          accepted: true,
          policyVersion: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      addresses,
      orders,
      consents,
    };
  }

  async anonymize(userId: string, confirm: string) {
    if (confirm !== "EXCLUIR") {
      throw new BadRequestException('Confirme com confirm: "EXCLUIR"');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }
    if (user.anonymizedAt) {
      return { ok: true, alreadyAnonymized: true };
    }

    const stamp = Date.now();
    const anonymizedEmail = `anonimizado+${userId.slice(0, 8)}.${stamp}@deleted.local`;

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.address.deleteMany({ where: { userId } });
      await tx.cart.deleteMany({ where: { userId } });

      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Conta anonimizada",
          email: anonymizedEmail,
          passwordHash: `disabled:${stamp}`,
          anonymizedAt: new Date(),
        },
      });
    });

    return { ok: true, anonymizedAt: new Date().toISOString() };
  }
}
