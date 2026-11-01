/** Cookie httpOnly com o mesmo JWT de acesso do login, para o front no navegador não guardar token nenhum. */
export const SESSION_COOKIE = "salomar_session";

/** Validade padrão da sessão (e do JWT de acesso), no formato do jsonwebtoken. */
export const DEFAULT_SESSION_EXPIRES = "1d";

/** Valor de um cookie no header `cookie` (`a=1; b=2`), sem dependência de parser. */
export function readCookie(header: string | undefined, name: string) {
  for (const part of (header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

/** Token do `Authorization: Bearer` (scripts, testes, apps) ou, sem ele, do cookie de sessão do navegador. */
export function sessionToken(headers: {
  authorization?: string;
  cookie?: string;
}) {
  const header = headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return readCookie(headers.cookie, SESSION_COOKIE) || undefined;
}

const UNIT_SECONDS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 3600,
  d: 86_400,
  w: 604_800,
  y: 31_557_600,
};
const UNIT_ALIASES: Record<string, string> = {
  sec: "s",
  secs: "s",
  second: "s",
  seconds: "s",
  min: "m",
  mins: "m",
  minute: "m",
  minutes: "m",
  hr: "h",
  hrs: "h",
  hour: "h",
  hours: "h",
  day: "d",
  days: "d",
  week: "w",
  weeks: "w",
  year: "y",
  years: "y",
};

/**
 * Validade em segundos, no formato de `JWT_ACCESS_EXPIRES` (o do jsonwebtoken: "1d", "12h", "90 minutes";
 * número puro é segundos, texto sem unidade é milissegundos).
 */
export function durationInSeconds(value: string | number) {
  if (typeof value === "number") return value;
  const match = /^(\d+(?:\.\d+)?)\s*([a-z]*)$/i.exec(value.trim());
  const unit =
    match &&
    (UNIT_ALIASES[match[2].toLowerCase()] ??
      (match[2].toLowerCase() || "ms"));
  if (!match || !(unit! in UNIT_SECONDS)) {
    throw new Error(`JWT_ACCESS_EXPIRES inválido: "${value}"`);
  }
  return Math.floor(Number(match[1]) * UNIT_SECONDS[unit!]);
}
