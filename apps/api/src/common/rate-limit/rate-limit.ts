import { Throttle } from "@nestjs/throttler";

const MINUTE = 60_000;

function envNumber(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} deve ser um número (recebido: "${raw}")`);
  }
  return value;
}

/** Limite geral por IP, aplicado a todas as rotas. */
export const defaultRateLimit = {
  ttl: MINUTE,
  limit: () => envNumber("RATE_LIMIT_PER_MINUTE", 120),
};

/**
 * Limite mais baixo para rotas que aceitam senha ou token (login, cadastro, refresh, recuperação e troca
 * de senha), contra tentativa e erro.
 */
export const SensitiveRateLimit = () =>
  Throttle({
    default: {
      ttl: MINUTE,
      limit: () => envNumber("AUTH_RATE_LIMIT_PER_MINUTE", 10),
    },
  });
