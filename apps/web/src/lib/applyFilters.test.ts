import { describe, expect, it } from 'vitest'
import { applyFilters } from './applyFilters'
import { emptyFilters, type ProductFilters } from './filters'
import { sampleProducts } from '../test/fixtures'

describe('applyFilters', () => {
  it('com emptyFilters devolve a lista intacta', () => {
    expect(applyFilters(sampleProducts, emptyFilters)).toEqual(sampleProducts)
  })

  it('filtra por categoria', () => {
    const filters: ProductFilters = { ...emptyFilters, category: 'Camisas' }
    expect(applyFilters(sampleProducts, filters).map((p) => p.id)).toEqual([
      'camisa-algodao-branca',
    ])
  })

  it('filtra por tamanho', () => {
    const filters: ProductFilters = { ...emptyFilters, size: '48' }
    expect(applyFilters(sampleProducts, filters).map((p) => p.id)).toEqual([
      'calca-linho-areia',
    ])
  })

  it('filtra por tom', () => {
    const filters: ProductFilters = { ...emptyFilters, tone: 'areia' }
    expect(applyFilters(sampleProducts, filters).map((p) => p.id)).toEqual([
      'calca-linho-areia',
    ])
  })

  it('filtra por faixa de preço', () => {
    const filters: ProductFilters = { ...emptyFilters, priceMin: 700, priceMax: 900 }
    expect(applyFilters(sampleProducts, filters).map((p) => p.id)).toEqual([
      'calca-linho-areia',
    ])
  })

  it('combina categoria e tamanho', () => {
    const filters: ProductFilters = {
      ...emptyFilters,
      category: 'Camisas',
      size: 'M',
    }
    expect(applyFilters(sampleProducts, filters).map((p) => p.id)).toEqual([
      'camisa-algodao-branca',
    ])

    const noMatch: ProductFilters = {
      ...emptyFilters,
      category: 'Camisas',
      size: '48',
    }
    expect(applyFilters(sampleProducts, noMatch)).toEqual([])
  })
})
