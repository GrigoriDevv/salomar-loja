import {
  SHIPPING_TABLE_VERSION,
  buildShippingOptions,
  isValidCepFormat,
  normalizeCep,
  regionForCepPrefix,
  findOption,
} from './shipping-table'

describe('shipping-table', () => {
  it('normaliza CEP removendo não-dígitos', () => {
    expect(normalizeCep('01310-100')).toBe('01310100')
  })

  it('rejeita CEP inválido', () => {
    expect(isValidCepFormat('123')).toBe(false)
    expect(isValidCepFormat('00000000')).toBe(false)
    expect(isValidCepFormat('01310100')).toBe(true)
  })

  it('mapeia prefixos para regiões', () => {
    expect(regionForCepPrefix(13)).toBe('sudeste')
    expect(regionForCepPrefix(800)).toBe('sul')
    expect(regionForCepPrefix(400)).toBe('nordeste')
    expect(regionForCepPrefix(700)).toBe('norte_centro')
    expect(regionForCepPrefix(5)).toBeNull()
  })

  it('calcula pac e express com unidade extra', () => {
    const one = buildShippingOptions('01310100', 1)
    const two = buildShippingOptions('01310100', 2)
    expect(one).toHaveLength(2)
    expect(one[0].serviceCode).toBe('pac')
    expect(one[1].serviceCode).toBe('express')
    expect(two[0].priceCents).toBeGreaterThan(one[0].priceCents)
    expect(one[1].priceCents).toBeGreaterThan(one[0].priceCents)
    expect(one[1].days).toBeLessThan(one[0].days)
  })

  it('lança para CEP fora das faixas', () => {
    expect(() => buildShippingOptions('00000001', 1)).toThrow()
  })

  it('findOption encontra serviço', () => {
    const opts = buildShippingOptions('01310100', 1)
    expect(findOption(opts, 'pac')?.serviceName).toBe('Econômico')
    expect(findOption(opts, 'sedex')).toBeUndefined()
  })

  it('tem versão de tabela estável', () => {
    expect(SHIPPING_TABLE_VERSION).toBe('v1')
  })
})
