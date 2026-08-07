import { describe, expect, it } from "vitest";
import type { CartLineView } from "../types/CartLineTypes";
import { applyStockToCart } from "./validate-cart-stock";

function line(
  partial: Partial<CartLineView> &
    Pick<CartLineView, "productVariantId" | "quantity" | "name">,
): CartLineView {
  return {
    productId: "p1",
    unitPrice: 100,
    image: "/x.jpg",
    focus: "50% 50%",
    size: "M",
    color: "preto",
    stock: 10,
    ...partial,
  };
}

describe("applyStockToCart", () => {
  it("mantém linhas quando qty <= stock", () => {
    const items = [line({ productVariantId: "v1", name: "Camisa", quantity: 2 })];
    const stock = new Map([["v1", 5]]);

    const result = applyStockToCart(items, stock);

    expect(result.ok).toBe(true);
    expect(result.problems).toHaveLength(0);
    expect(result.adjusted).toEqual([
      expect.objectContaining({ productVariantId: "v1", quantity: 2, stock: 5 }),
    ]);
  });

  it("clampa quantidade quando qty > stock", () => {
    const items = [line({ productVariantId: "v1", name: "Calça", quantity: 8 })];
    const stock = new Map([["v1", 3]]);

    const result = applyStockToCart(items, stock);

    expect(result.ok).toBe(false);
    expect(result.adjusted[0]?.quantity).toBe(3);
    expect(result.problems).toEqual([
      expect.objectContaining({
        productVariantId: "v1",
        reason: "clamped",
        available: 3,
        requested: 8,
      }),
    ]);
  });

  it("remove linha esgotada (stock 0 ou ausente)", () => {
    const items = [
      line({ productVariantId: "gone", name: "Vestido", quantity: 1 }),
      line({ productVariantId: "ok", name: "Blazer", quantity: 1 }),
    ];
    const stock = new Map([
      ["gone", 0],
      ["ok", 2],
    ]);

    const result = applyStockToCart(items, stock);

    expect(result.ok).toBe(false);
    expect(result.adjusted).toHaveLength(1);
    expect(result.adjusted[0]?.productVariantId).toBe("ok");
    expect(result.problems).toEqual([
      expect.objectContaining({
        productVariantId: "gone",
        reason: "unavailable",
        available: 0,
      }),
    ]);
  });

  it("trata variant ausente no mapa como unavailable", () => {
    const items = [line({ productVariantId: "missing", name: "Saia", quantity: 2 })];

    const result = applyStockToCart(items, new Map());

    expect(result.ok).toBe(false);
    expect(result.adjusted).toEqual([]);
    expect(result.problems[0]?.reason).toBe("unavailable");
  });
});
