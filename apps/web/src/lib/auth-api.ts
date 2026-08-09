const TOKEN_KEY = "salomar-access-token";
const EMAIL_KEY = "salomar-user-email";
const ROLE_KEY = "salomar-user-role";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type AuthSession = {
  accessToken: string;
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

function authHeaders(): HeadersInit {
  const accessToken = getAccessToken();
  return accessToken
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      }
    : { "Content-Type": "application/json" };
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
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

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(ROLE_KEY);
}

function persistSession(body: {
  accessToken?: string;
  email?: string;
  name?: string;
  role?: string;
}): AuthSession {
  if (!body.accessToken || !body.email) {
    throw new Error("Resposta de autenticação inválida");
  }
  setAccessToken(body.accessToken);
  try {
    localStorage.setItem(EMAIL_KEY, body.email);
    localStorage.setItem(ROLE_KEY, body.role ?? "cliente");
  } catch {
    /* ignore */
  }
  return {
    accessToken: body.accessToken,
    email: body.email,
    name: body.name ?? body.email,
    role: body.role ?? "cliente",
  };
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
  const response = await fetch(new URL("/auth/login", API_URL), {
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
  const response = await fetch(new URL("/auth/register", API_URL), {
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
  const response = await fetch(new URL("/auth/forgot-password", API_URL), {
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
  const response = await fetch(new URL("/auth/reset-password", API_URL), {
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
  const response = await fetch(new URL("/me/profile", API_URL), {
    headers: authHeaders(),
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
  const response = await fetch(new URL("/me", API_URL), {
    method: "PATCH",
    headers: authHeaders(),
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
