const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type ShippingServiceCode = 'pac' | 'express'

export type ShippingOption = {
  serviceCode: ShippingServiceCode
  serviceName: string
  priceCents: number
  days: number
}

export type ShippingQuote = {
  cep: string
  options: ShippingOption[]
}

export type ShippingCartItem = {
  productVariantId: string
  quantity: number
}

export async function calculateShipping(
  cep: string,
  items: ShippingCartItem[],
): Promise<ShippingQuote> {
  const digits = cep.replace(/\D/g, '')
  const res = await fetch(new URL('/shipping/calculate', API_URL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cep: digits,
      items: items.map((i) => ({
        productVariantId: i.productVariantId,
        quantity: i.quantity,
      })),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message =
      typeof err?.message === 'string'
        ? err.message
        : Array.isArray(err?.message)
          ? err.message.join(', ')
          : 'Não foi possível calcular o frete'
    throw new Error(message)
  }

  return res.json() as Promise<ShippingQuote>
}
