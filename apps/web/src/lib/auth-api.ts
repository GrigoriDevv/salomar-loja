const TOKEN_KEY = "salomar-access-token";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type AuthSession = {
  accessToken: string;
  email: string;
  name: string;
  role: string;
};

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
        : `Falha no login (${response.status})`,
    );
  }

  const body = (await response.json()) as {
    accessToken?: string;
    email?: string;
    name?: string;
    role?: string;
  };

  if (!body.accessToken || !body.email) {
    throw new Error("Resposta de login inválida");
  }

  setAccessToken(body.accessToken);

  return {
    accessToken: body.accessToken,
    email: body.email,
    name: body.name ?? body.email,
    role: body.role ?? "cliente",
  };
}
