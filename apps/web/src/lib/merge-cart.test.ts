import { describe, expect, it } from "vitest";
import { mergeCartLines } from "./merge-cart";

describe("mergeCartLines", () => {
  it("usa Math.max quando o mesmo variant está nos dois lados", () => {
    expect(
      mergeCartLines(
        [{ productVariantId: "a", quantity: 2 }],
        [{ productVariantId: "a", quantity: 5 }],
      ),
    ).toEqual([{ productVariantId: "a", quantity: 5 }]);

    expect(
      mergeCartLines(
        [{ productVariantId: "a", quantity: 7 }],
        [{ productVariantId: "a", quantity: 3 }],
      ),
    ).toEqual([{ productVariantId: "a", quantity: 7 }]);
  });

  it("une variantes distintas de local e server", () => {
    const merged = mergeCartLines(
      [
        { productVariantId: "local-only", quantity: 1 },
        { productVariantId: "both", quantity: 2 },
      ],
      [
        { productVariantId: "server-only", quantity: 4 },
        { productVariantId: "both", quantity: 9 },
      ],
    );

    expect(merged).toEqual(
      expect.arrayContaining([
        { productVariantId: "local-only", quantity: 1 },
        { productVariantId: "server-only", quantity: 4 },
        { productVariantId: "both", quantity: 9 },
      ]),
    );
    expect(merged).toHaveLength(3);
  });

  it("com listas vazias devolve vazio", () => {
    expect(mergeCartLines([], [])).toEqual([]);
  });
});
