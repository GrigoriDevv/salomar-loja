import { clearAccessToken, getAccessToken } from "./auth-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function authHeaders(): HeadersInit {
  const accessToken = getAccessToken();
  return accessToken
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      }
    : { "Content-Type": "application/json" };
}

async function readError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  if (typeof err?.message === "string") return err.message;
  if (Array.isArray(err?.message)) return err.message.join(", ");
  return fallback;
}

export async function exportMyData(
  format: "json" | "csv" = "json",
): Promise<unknown | Blob> {
  const url = new URL("/me/data", API_URL);
  url.searchParams.set("format", format);
  const response = await fetch(url, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Falha ao exportar dados"));
  }
  if (format === "csv") {
    return response.blob();
  }
  return response.json();
}

export async function anonymizeAccount(): Promise<void> {
  const response = await fetch(new URL("/me", API_URL), {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ confirm: "EXCLUIR" }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Falha ao excluir conta"));
  }
  clearAccessToken();
}

export async function updatePreferences(input: {
  marketing: boolean;
  analytics?: boolean;
  policyVersion?: string;
}): Promise<unknown> {
  const response = await fetch(new URL("/me/preferences", API_URL), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(
      await readError(response, "Falha ao atualizar preferências"),
    );
  }
  return response.json();
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
