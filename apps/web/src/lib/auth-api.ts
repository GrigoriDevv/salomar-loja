import { apiFetch } from "./http";
/** Chave antiga: o token ficava no localStorage. Apagada na carga para não sobrar token no navegador. */
const LEGACY_TOKEN_KEY = "salomar-access-token";
const EMAIL_KEY = "salomar-user-email";
const ROLE_KEY = "salomar-user-role";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

try {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
} catch {
  /* ignore */
}

/**
 * A sessão vive só no cookie httpOnly que a API grava no login (o JavaScript não lê). Aqui ficam apenas
 * e-mail e papel, para a interface saber o que mostrar; quem decide o acesso é sempre a API.
 */
export type AuthSession = {
  email: string;
  name: string;
  role: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export function hasSession(): boolean {
  return Boolean(getUserEmail());
}

export function getUserEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  try {
    return localStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

/** Esquece a sessão só no navegador (a API já recusou ou encerrou). */
export function clearSession(): void {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    /* ignore */
  }
}

function persistSession(body: {
  email?: string;
  name?: string;
  role?: string;
}): AuthSession {
  if (!body.email) {
    throw new Error("Resposta de autenticação inválida");
  }
  try {
    localStorage.setItem(EMAIL_KEY, body.email);
    localStorage.setItem(ROLE_KEY, body.role ?? "cliente");
  } catch {
    /* ignore */
  }
  return {
    email: body.email,
    name: body.name ?? body.email,
    role: body.role ?? "cliente",
  };
}

/** Encerra a sessão na API (todos os dispositivos) e apaga o cookie. */
export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch(new URL("/auth/logout", API_URL), { method: "POST" });
  } finally {
    clearSession();
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  if (typeof err?.message === "string") return err.message;
  if (Array.isArray(err?.message)) return err.message.join(", ");
  return fallback;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await apiFetch(new URL("/auth/login", API_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "E-mail ou senha inválidos"
        : await readError(response, `Falha no login (${response.status})`),
    );
  }

  return persistSession((await response.json()) as AuthSession);
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await apiFetch(new URL("/auth/register", API_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? "E-mail já cadastrado"
        : await readError(response, `Falha no cadastro (${response.status})`),
    );
  }

  return persistSession((await response.json()) as AuthSession);
}

export async function forgotPasswordRequest(email: string): Promise<string> {
  const response = await apiFetch(new URL("/auth/forgot-password", API_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Falha ao solicitar recuperação"));
  }
  const body = (await response.json()) as { message?: string };
  return body.message ?? "Se o e-mail existir, enviaremos instruções.";
}

export async function resetPasswordRequest(
  token: string,
  password: string,
): Promise<string> {
  const response = await apiFetch(new URL("/auth/reset-password", API_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Não foi possível redefinir a senha"));
  }
  const body = (await response.json()) as { message?: string };
  return body.message ?? "Senha atualizada";
}

export async function getProfile(): Promise<UserProfile> {
  const response = await apiFetch(new URL("/me/profile", API_URL), {
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Falha ao carregar perfil"));
  }
  return response.json() as Promise<UserProfile>;
}

export async function updateProfile(input: {
  name?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
}): Promise<UserProfile> {
  const response = await apiFetch(new URL("/me", API_URL), {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Falha ao atualizar perfil"));
  }
  const profile = (await response.json()) as UserProfile;
  try {
    localStorage.setItem(EMAIL_KEY, profile.email);
    localStorage.setItem(ROLE_KEY, profile.role);
  } catch {
    /* ignore */
  }
  return profile;
}
