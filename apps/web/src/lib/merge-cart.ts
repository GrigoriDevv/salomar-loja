export type CartLineDto = {
  productVariantId: string;
  quantity: number;
};

export function mergeCartLines(local: CartLineDto[], server: CartLineDto[]) {
  const map = new Map<string, number>();
  for (const line of [...server, ...local]) {
    const prev = map.get(line.productVariantId) ?? 0;
    map.set(line.productVariantId, Math.max(prev, line.quantity));
  }
  return [...map.entries()].map(([productVariantId, quantity]) => ({
    productVariantId,
    quantity,
  }));
}
