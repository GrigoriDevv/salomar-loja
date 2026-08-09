import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// Load .env before Nest ConfigModule (instrument runs first)
loadEnv({ path: resolve(__dirname, '../.env') })
loadEnv({ path: resolve(__dirname, '../../../.env') })

const dsn = process.env.SENTRY_DSN?.trim()
const explicitlyOn =
  process.env.SENTRY_ENABLED === '1' || process.env.SENTRY_ENABLED === 'true'
const explicitlyOff =
  process.env.SENTRY_ENABLED === '0' || process.env.SENTRY_ENABLED === 'false'
// On Vercel, require explicit SENTRY_ENABLED=1 (avoids native/Sentry cold-start crashes).
const sentryEnabled = Boolean(dsn) && (process.env.VERCEL ? explicitlyOn : !explicitlyOff)

if (sentryEnabled) {
  // Dynamic require — avoid loading Sentry/native addons when disabled (Vercel).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require('@sentry/nestjs') as typeof import('@sentry/nestjs')
  const tracesSampleRate = Number(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? '1.0',
  )
  const profileSessionSampleRate = Number(
    process.env.SENTRY_PROFILE_SESSION_SAMPLE_RATE ?? '1.0',
  )

  const integrations: unknown[] = []
  if (!process.env.VERCEL) {
    try {
      const { nodeProfilingIntegration } = require('@sentry/profiling-node') as {
        nodeProfilingIntegration: () => unknown
      }
      integrations.push(nodeProfilingIntegration())
    } catch {
      // Profiling optional
    }
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
    integrations: integrations as never[],
    enableLogs: true,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 1.0,
    ...(integrations.length > 0
      ? {
          profileSessionSampleRate: Number.isFinite(profileSessionSampleRate)
            ? profileSessionSampleRate
            : 1.0,
          profileLifecycle: 'trace' as const,
        }
      : {}),
  })
}

export const isSentryEnabled = () => sentryEnabled
