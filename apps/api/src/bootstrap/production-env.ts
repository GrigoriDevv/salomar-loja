/** Variáveis sem as quais a API não pode subir em produção: falha no boot em vez de rodar insegura. */
const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FIELD_ENCRYPTION_KEY',
  'CORS_ORIGIN',
] as const

/** Segredos de exemplo do .env.example que nunca podem ir para produção. */
const EXAMPLE_SECRETS = new Set(['dev-access-secret-change-me', 'dev-refresh-secret-change-me'])

export function assertProductionEnv(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return

  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]?.trim())
  // Sem o segredo, o webhook do Mercado Pago não confere a assinatura de quem chama.
  if (env.MP_ACCESS_TOKEN?.trim() && !env.MP_WEBHOOK_SECRET?.trim()) {
    missing.push('MP_WEBHOOK_SECRET' as never)
  }
  if (missing.length) {
    throw new Error(`Variáveis obrigatórias em produção não definidas: ${missing.join(', ')}`)
  }

  const weak = (['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const).filter((name) => {
    const value = env[name]!.trim()
    return EXAMPLE_SECRETS.has(value) || value.length < 32
  })
  if (weak.length) {
    throw new Error(`Segredos fracos ou de exemplo em produção: ${weak.join(', ')} (use 32+ caracteres aleatórios)`)
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET e JWT_REFRESH_SECRET precisam ser diferentes')
  }
}
