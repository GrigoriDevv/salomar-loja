import { describe, expect, it } from "vitest";
import { sampleProducts } from "../test/fixtures";
import type { CartLineView } from "../types/CartLineTypes";
import { cartReducer } from "./store";

const product = sampleProducts[0];

const line48: CartLineView = {
  productVariantId: "var-calca-48",
  quantity: 1,
  productId: product.id,
  name: product.name,
  size: "48",
  color: "areia",
  unitPrice: product.price,
  image: product.image,
  focus: product.focus,
  stock: 4,
};

const line50: CartLineView = {
  ...line48,
  productVariantId: "var-calca-50",
  size: "50",
  stock: 2,
};

describe("cart reducer", () => {
  it("adds a sized product and combines equal items", () => {
    const initial = { items: [], isOpen: false };
    const once = cartReducer(initial, { type: "add", item: line48 });
    const twice = cartReducer(once, { type: "add", item: line48 });

    expect(twice.isOpen).toBe(true);
    expect(twice.items).toHaveLength(1);
    expect(twice.items[0].quantity).toBe(2);
  });

  it("keeps different sizes as separate cart lines", () => {
    const initial = { items: [], isOpen: false };
    const firstSize = cartReducer(initial, { type: "add", item: line48 });
    const secondSize = cartReducer(firstSize, { type: "add", item: line50 });

    expect(secondSize.items).toHaveLength(2);
  });

  it("removes an item when quantity reaches zero", () => {
    const added = cartReducer(
      { items: [], isOpen: false },
      { type: "add", item: line48 },
    );
    const removed = cartReducer(added, {
      type: "quantity",
      productVariantId: line48.productVariantId,
      quantity: 0,
    });

    expect(removed.items).toHaveLength(0);
  });

  it("ajusta quantidade por productVariantId", () => {
    const added = cartReducer(
      { items: [], isOpen: false },
      { type: "add", item: line48 },
    );
    const updated = cartReducer(added, {
      type: "quantity",
      productVariantId: line48.productVariantId,
      quantity: 5,
    });

    expect(updated.items[0].quantity).toBe(5);
  });
});
