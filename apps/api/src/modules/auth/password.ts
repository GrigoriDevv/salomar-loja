import { compare, hash } from "bcryptjs";

export const BCRYPT_COST = 12;

// Hash bcrypt válido de uma senha aleatória, usado para manter o tempo de resposta
// do login constante quando o e-mail não existe.
const DUMMY_HASH =
  "$2b$12$PYNdttDYbCaaLdmrWqW1o.wPPB2uTEeO4Qq0zRgNUaRFlebQxw8jS";

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

/** Hashes antigos com custo 10 continuam válidos; o bcrypt lê o custo do próprio hash. */
export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function burnPasswordCheck(password: string): Promise<void> {
  await compare(password, DUMMY_HASH);
}
