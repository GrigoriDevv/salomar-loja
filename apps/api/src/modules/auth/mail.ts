import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const apiKey = this.config.get<string>("RESEND_API_KEY")?.trim();
    const from =
      this.config.get<string>("RESEND_FROM")?.trim() ||
      "Salomar <onboarding@resend.dev>";

    if (!apiKey) {
      if (this.config.get<string>("NODE_ENV") !== "production") {
        this.logger.warn(
          `RESEND_API_KEY ausente — link de reset (dev): ${resetUrl}`,
        );
      }
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Redefinir senha — Salomar",
        text: `Para redefinir sua senha, acesse: ${resetUrl}\n\nO link expira em 1 hora.`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(`Falha ao enviar e-mail Resend: ${res.status} ${detail}`);
    }
  }
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}
