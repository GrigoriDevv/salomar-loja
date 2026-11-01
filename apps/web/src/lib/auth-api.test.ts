// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasSession, loginRequest, logoutRequest } from "./auth-api";

describe("sessão em cookie httpOnly", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("login manda credentials: include e não guarda token no navegador", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ accessToken: "jwt", refreshToken: "r", email: "ana@x.com", role: "cliente" }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await loginRequest("ana@x.com", "senha1234");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "include" });
    expect(hasSession()).toBe(true);
    const stored = Object.keys(localStorage).map((key) => localStorage.getItem(key)).join(" ");
    expect(stored).not.toContain("jwt");
    expect(localStorage.getItem("salomar-access-token")).toBeNull();
  });

  it("401 da API encerra a sessão na interface", async () => {
    localStorage.setItem("salomar-user-email", "ana@x.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));

    await expect(loginRequest("ana@x.com", "errada123")).rejects.toThrow();
    expect(hasSession()).toBe(false);
  });

  it("logout chama a API e limpa a sessão", async () => {
    localStorage.setItem("salomar-user-email", "ana@x.com");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await logoutRequest();

    expect(String(fetchMock.mock.calls[0][0])).toContain("/auth/logout");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "include" });
    expect(hasSession()).toBe(false);
  });
});
