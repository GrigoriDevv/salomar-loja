import { BadRequestException, Injectable } from "@nestjs/common";
import type { ConsentCategory } from "../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ConsentSubjectError,
  recordConsent,
} from "./record-consent";
import type { RecordConsentDto } from "./dto/record-consent.dto";

const CATEGORIES: ConsentCategory[] = [
  "essential",
  "analytics",
  "marketing",
];

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    dto: RecordConsentDto,
    userId?: string | null,
  ) {
    const subjectUserId = userId?.trim() || null;
    const visitorId = subjectUserId
      ? null
      : dto.visitorId?.trim() || null;

    if (!subjectUserId && !visitorId) {
      throw new BadRequestException(
        "Informe visitorId ou autentique-se para registrar consentimento",
      );
    }

    const acceptedByCategory: Record<ConsentCategory, boolean> = {
      essential: true,
      analytics: Boolean(dto.categories.analytics),
      marketing: Boolean(dto.categories.marketing),
    };

    try {
      const rows = [];
      for (const category of CATEGORIES) {
        const row = await recordConsent(this.prisma, {
          userId: subjectUserId,
          visitorId,
          category,
          accepted: acceptedByCategory[category],
          policyVersion: dto.policyVersion.trim(),
        });
        rows.push(row);
      }
      return {
        policyVersion: dto.policyVersion.trim(),
        categories: acceptedByCategory,
        recorded: rows.map((r) => ({
          id: r.id,
          category: r.category,
          accepted: r.accepted,
          createdAt: r.createdAt,
        })),
      };
    } catch (err) {
      if (err instanceof ConsentSubjectError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async currentForVisitor(visitorId: string) {
    const id = visitorId.trim();
    if (!id) {
      throw new BadRequestException("visitorId obrigatório");
    }
    return this.latestBySubject({ visitorId: id });
  }

  async currentForUser(userId: string) {
    return this.latestBySubject({ userId });
  }

  private async latestBySubject(where: {
    userId?: string;
    visitorId?: string;
  }) {
    const rows = await this.prisma.consent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const latest: Partial<
      Record<
        ConsentCategory,
        {
          accepted: boolean;
          policyVersion: string;
          createdAt: Date;
        }
      >
    > = {};

    for (const row of rows) {
      if (latest[row.category]) continue;
      latest[row.category] = {
        accepted: row.accepted,
        policyVersion: row.policyVersion,
        createdAt: row.createdAt,
      };
    }

    return {
      categories: {
        essential: latest.essential?.accepted ?? true,
        analytics: latest.analytics?.accepted ?? false,
        marketing: latest.marketing?.accepted ?? false,
      },
      details: latest,
      policyVersion:
        latest.essential?.policyVersion ??
        latest.analytics?.policyVersion ??
        latest.marketing?.policyVersion ??
        null,
    };
  }
}
