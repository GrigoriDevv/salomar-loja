import { describe, expect, it } from 'vitest'
import { parseCatalogResponse } from './api'

describe('parseCatalogResponse', () => {
  it('aceita o contrato { data, meta } da API', () => {
    const payload = {
      data: [{ id: 'camiseta-branca', name: 'Camiseta Branca' }],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    }

    expect(parseCatalogResponse(payload)).toEqual(payload)
  })

  it('rejeita payload sem data/meta', () => {
    expect(() => parseCatalogResponse([{ id: 'x' }])).toThrow(/data\/meta/)
    expect(() => parseCatalogResponse(null)).toThrow(/inválida/)
  })
})
