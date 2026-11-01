import { describe, expect, it } from "vitest";
import { formatShippingAddress, type AdminOrderShipping } from "./admin-api";

const base: AdminOrderShipping = {
  recipient: "Teste Silva",
  street: "Av. Paulista",
  number: "1000",
  complement: "Apto 12",
  district: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  cep: "01310100",
  serviceCode: "pac",
  priceCents: 1890,
};

describe("formatShippingAddress", () => {
  it("monta o endereço completo em uma linha", () => {
    expect(formatShippingAddress(base)).toBe(
      "Av. Paulista, 1000 — Apto 12 · Bela Vista · São Paulo/SP · CEP 01310-100",
    );
  });

  it("aceita pedidos antigos que só têm cidade, UF e CEP", () => {
    expect(
      formatShippingAddress({
        ...base,
        street: null,
        number: null,
        complement: null,
        district: null,
      }),
    ).toBe("São Paulo/SP · CEP 01310-100");
  });
});
