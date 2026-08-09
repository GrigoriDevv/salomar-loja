import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { recordAccessLog } from "../audit/access-log.store";
import { decryptCpf } from "../crypto/cpf";
import { PrismaService } from "../../prisma/prisma.service";

export type PrivacyExportPayload = {
  exportedAt: string;
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    cpf: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  addresses: unknown[];
  orders: unknown[];
  consents: unknown[];
};

function csvEscape(value: unknown): string {
  const raw =
    value === null || value === undefined
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildExportPayload(
    userId: string,
  ): Promise<PrivacyExportPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpfEncrypted: true,
        createdAt: true,
        updatedAt: true,
        anonymizedAt: true,
      },
    });
    if (!user || user.anonymizedAt) {
      throw new UnauthorizedException("Conta indisponível");
    }

    let cpf: string | null = null;
    if (user.cpfEncrypted) {
      try {
        cpf = decryptCpf(user.cpfEncrypted);
      } catch {
        cpf = null;
      }
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
        cpf,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      addresses,
      orders,
      consents,
    };
  }

  async exportData(
    userId: string,
    format: "json" | "csv" = "json",
  ): Promise<PrivacyExportPayload | string> {
    const payload = await this.buildExportPayload(userId);

    await recordAccessLog(this.prisma, {
      actor: userId,
      action: "data_export",
      resource: `user:${userId}`,
      detail: { format },
    });

    if (format === "csv") {
      return this.toCsv(payload);
    }
    return payload;
  }

  toCsv(payload: PrivacyExportPayload): string {
    const rows: string[] = ["section,key,value"];
    const push = (section: string, key: string, value: unknown) => {
      rows.push(
        [csvEscape(section), csvEscape(key), csvEscape(value)].join(","),
      );
    };

    push("meta", "exportedAt", payload.exportedAt);
    for (const [key, value] of Object.entries(payload.profile)) {
      push("profile", key, value);
    }
    payload.addresses.forEach((addr, i) => {
      push("addresses", String(i), addr);
    });
    payload.orders.forEach((order, i) => {
      push("orders", String(i), order);
    });
    payload.consents.forEach((consent, i) => {
      push("consents", String(i), consent);
    });

    return `${rows.join("\n")}\n`;
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

      // Order / OrderItem / Payment / Consent / AccessLog are retained (legal obligation).
      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Conta anonimizada",
          email: anonymizedEmail,
          passwordHash: `disabled:${stamp}`,
          cpfEncrypted: null,
          cpfLookupHash: null,
          anonymizedAt: new Date(),
        },
      });
    });

    await recordAccessLog(this.prisma, {
      actor: userId,
      action: "account_anonymize",
      resource: `user:${userId}`,
    });

    return { ok: true, anonymizedAt: new Date().toISOString() };
  }
}
