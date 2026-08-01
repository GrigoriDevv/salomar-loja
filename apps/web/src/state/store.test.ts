import { describe, expect, it } from 'vitest'
import { sampleProducts } from '../test/fixtures'
import { cartReducer } from './store'

describe('cart reducer', () => {
  it('adds a sized product and combines equal items', () => {
    const initial = { items: [], isOpen: false }
    const once = cartReducer(initial, { type: 'add', product: sampleProducts[0], size: '48' })
    const twice = cartReducer(once, { type: 'add', product: sampleProducts[0], size: '48' })

    expect(twice.isOpen).toBe(true)
    expect(twice.items).toHaveLength(1)
    expect(twice.items[0].quantity).toBe(2)
  })

  it('keeps different sizes as separate cart lines', () => {
    const initial = { items: [], isOpen: false }
    const firstSize = cartReducer(initial, { type: 'add', product: sampleProducts[0], size: '48' })
    const secondSize = cartReducer(firstSize, { type: 'add', product: sampleProducts[0], size: '50' })

    expect(secondSize.items).toHaveLength(2)
  })

  it('removes an item when quantity reaches zero', () => {
    const added = cartReducer(
      { items: [], isOpen: false },
      { type: 'add', product: sampleProducts[0], size: '48' },
    )
    const removed = cartReducer(added, {
      type: 'quantity',
      productId: sampleProducts[0].id,
      size: '48',
      quantity: 0,
    })

    expect(removed.items).toHaveLength(0)
  })
})
