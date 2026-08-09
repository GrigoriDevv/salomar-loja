import { createHash } from 'node:crypto'
import { SHIPPING_TABLE_VERSION } from './shipping-table'
import { ShippingService } from './shipping.service'

describe('ShippingService.buildCacheKey', () => {
  const service = new ShippingService({} as never)

  it('é estável independente da ordem dos itens', () => {
    const a = service.buildCacheKey('01310100', [
      { productVariantId: 'b', quantity: 1 },
      { productVariantId: 'a', quantity: 2 },
    ])
    const b = service.buildCacheKey('01310100', [
      { productVariantId: 'a', quantity: 2 },
      { productVariantId: 'b', quantity: 1 },
    ])
    expect(a).toBe(b)
  })

  it('muda quando quantidade muda', () => {
    const a = service.buildCacheKey('01310100', [
      { productVariantId: 'a', quantity: 1 },
    ])
    const b = service.buildCacheKey('01310100', [
      { productVariantId: 'a', quantity: 2 },
    ])
    expect(a).not.toBe(b)
  })

  it('bate com sha1 esperado', () => {
    const items = [{ productVariantId: 'a', quantity: 1 }]
    const key = service.buildCacheKey('01310100', items)
    const expected = createHash('sha1')
      .update(
        JSON.stringify({
          v: SHIPPING_TABLE_VERSION,
          cep: '01310100',
          items: [{ productVariantId: 'a', quantity: 1 }],
        }),
      )
      .digest('hex')
    expect(key).toBe(expected)
  })
})
