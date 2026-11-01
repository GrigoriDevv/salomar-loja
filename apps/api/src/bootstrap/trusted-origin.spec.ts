import { isTrustedOrigin } from './trusted-origin'

const allowed = ['http://localhost:5180']
const cookie = 'salomar_session=abc'

describe('isTrustedOrigin (CSRF)', () => {
  it('recusa POST autenticado por cookie vindo de outro site', () => {
    expect(
      isTrustedOrigin({ method: 'POST', headers: { cookie, origin: 'https://evil.example' } }, allowed),
    ).toBe(false)
  })

  it('recusa POST autenticado por cookie sem Origin', () => {
    expect(isTrustedOrigin({ method: 'POST', headers: { cookie } }, allowed)).toBe(false)
  })

  it('aceita POST com cookie vindo da loja', () => {
    expect(
      isTrustedOrigin({ method: 'POST', headers: { cookie, origin: 'http://localhost:5180' } }, allowed),
    ).toBe(true)
  })

  it('não interfere em GET, Bearer ou pedido sem cookie (webhook)', () => {
    expect(isTrustedOrigin({ method: 'GET', headers: { cookie } }, allowed)).toBe(true)
    expect(
      isTrustedOrigin({ method: 'POST', headers: { cookie, authorization: 'Bearer t' } }, allowed),
    ).toBe(true)
    expect(isTrustedOrigin({ method: 'POST', headers: {} }, allowed)).toBe(true)
  })
})
