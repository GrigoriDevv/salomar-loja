import * as Sentry from '@sentry/nestjs'

export type ObservabilityDomain = 'payment' | 'nfe' | 'webhook'

/**
 * Captura erro no Sentry com tag `domain` para alertas (payment / nfe / webhook).
 * No-op se Sentry não estiver inicializado (sem DSN).
 */
export function captureDomainError(
  domain: ObservabilityDomain,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    scope.setTag('domain', domain)
    if (extra) {
      scope.setExtras(extra)
    }
    Sentry.captureException(error)
  })
}
