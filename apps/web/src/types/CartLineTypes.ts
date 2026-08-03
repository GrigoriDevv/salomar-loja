/** Identidade persistida (localStorage / futura API). */
export type CartLine = {
  productVariantId: string
  quantity: number
}

/** Snapshot para a UI — inclui a identidade da linha. */
export type CartLineView = CartLine & {
  productId: string
  name: string
  size: string
  color: string
  unitPrice: number
  image: string
  focus: string
  stock?: number
}
