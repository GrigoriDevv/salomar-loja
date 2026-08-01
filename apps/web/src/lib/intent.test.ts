import { describe, expect, it } from 'vitest'
import { sampleProducts } from '../test/fixtures'
import { detectIntent, rankProducts } from './intent'

describe('intent engine', () => {
  it('detects occasions from natural language', () => {
    expect(detectIntent('Preciso de algo leve para caminhar na praia')).toBe('beira-mar')
    expect(detectIntent('Quero um blazer para o pôr do sol')).toBe('por-do-sol')
    expect(detectIntent('Uma mala casual para viagem de fim de semana')).toBe('ilha')
  })

  it('falls back to essentials when no signal matches', () => {
    expect(detectIntent('Quero conhecer a Salomar')).toBe('essenciais')
  })

  it('places matching products first without mutating the catalog', () => {
    const originalFirst = sampleProducts[0]
    const ranked = rankProducts(sampleProducts, 'essenciais')

    expect(ranked[0].intents).toContain('essenciais')
    expect(sampleProducts[0]).toBe(originalFirst)
  })
})
