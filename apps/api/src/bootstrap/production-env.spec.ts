import { assertProductionEnv } from './production-env'

const strong = (c: string) => c.repeat(40)
const base = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://x',
  JWT_ACCESS_SECRET: strong('a'),
  JWT_REFRESH_SECRET: strong('b'),
  FIELD_ENCRYPTION_KEY: 'k',
  CORS_ORIGIN: 'https://loja.example',
}

describe('assertProductionEnv', () => {
  it('ignora fora de produção', () => {
    expect(() => assertProductionEnv({ NODE_ENV: 'development' })).not.toThrow()
  })

  it('aceita produção completa', () => {
    expect(() => assertProductionEnv(base)).not.toThrow()
  })

  it('falha sem variável obrigatória', () => {
    expect(() => assertProductionEnv({ ...base, CORS_ORIGIN: '' })).toThrow(/CORS_ORIGIN/)
  })

  it('exige MP_WEBHOOK_SECRET quando o Mercado Pago está ligado', () => {
    expect(() => assertProductionEnv({ ...base, MP_ACCESS_TOKEN: 'APP_USR-1' })).toThrow(/MP_WEBHOOK_SECRET/)
    expect(() =>
      assertProductionEnv({ ...base, MP_ACCESS_TOKEN: 'APP_USR-1', MP_WEBHOOK_SECRET: 's' }),
    ).not.toThrow()
  })

  it('recusa segredo de exemplo, curto ou repetido', () => {
    expect(() => assertProductionEnv({ ...base, JWT_ACCESS_SECRET: 'dev-access-secret-change-me' })).toThrow(/fracos/)
    expect(() => assertProductionEnv({ ...base, JWT_REFRESH_SECRET: 'curto' })).toThrow(/fracos/)
    expect(() => assertProductionEnv({ ...base, JWT_REFRESH_SECRET: base.JWT_ACCESS_SECRET })).toThrow(/diferentes/)
  })
})
