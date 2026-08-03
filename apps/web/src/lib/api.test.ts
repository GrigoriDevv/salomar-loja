import { describe, expect, it } from 'vitest'
import { parseCatalogResponse } from './api'

describe('parseCatalogResponse', () => {
  it('aceita o contrato { data, meta } da API e normaliza estoque', () => {
    const payload = {
      data: [{ id: 'camiseta-branca', name: 'Camiseta Branca', stock: 24, inStock: true }],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    }

    expect(parseCatalogResponse(payload)).toEqual(payload)
  })

  it('preenche stock/inStock quando ausentes', () => {
    const parsed = parseCatalogResponse({
      data: [{ id: 'x', name: 'X' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    })

    expect(parsed.data[0]).toMatchObject({ stock: 0, inStock: false })
  })

  it('rejeita payload sem data/meta', () => {
    expect(() => parseCatalogResponse([{ id: 'x' }])).toThrow(/data\/meta/)
    expect(() => parseCatalogResponse(null)).toThrow(/inválida/)
  })
})
