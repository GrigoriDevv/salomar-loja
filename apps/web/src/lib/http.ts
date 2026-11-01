/** Dicas de sessão que a interface guarda (e-mail e papel); o acesso real é o cookie httpOnly. */
const SESSION_HINT_KEYS = ["salomar-user-email", "salomar-user-role"];

/**
 * fetch para a API da loja: manda o cookie httpOnly de sessão (`credentials: "include"`). O navegador
 * não guarda token nenhum; a sessão vive só no cookie, que o JavaScript não lê. Um 401 significa que a
 * sessão expirou ou foi encerrada, então a interface deixa de se mostrar como logada.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const response = await fetch(input, { credentials: "include", ...init });
  if (response.status === 401) {
    try {
      for (const key of SESSION_HINT_KEYS) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  return response;
}
