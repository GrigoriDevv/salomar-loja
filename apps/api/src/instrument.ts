import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import * as Sentry from '@sentry/nestjs'

// Load .env before Nest ConfigModule (instrument runs first)
loadEnv({ path: resolve(__dirname, '../.env') })
loadEnv({ path: resolve(__dirname, '../../../.env') })

const dsn = process.env.SENTRY_DSN?.trim()
const sentryEnabled =
  process.env.SENTRY_ENABLED !== '0' &&
  process.env.SENTRY_ENABLED !== 'false' &&
  Boolean(dsn)

if (sentryEnabled) {
  const tracesSampleRate = Number(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? '1.0',
  )
  const profileSessionSampleRate = Number(
    process.env.SENTRY_PROFILE_SESSION_SAMPLE_RATE ?? '1.0',
  )

  // Native profiling crashes on Vercel — skip there; lazy-load elsewhere.
  const integrations: unknown[] = []
  if (!process.env.VERCEL) {
    try {
      const { nodeProfilingIntegration } = require('@sentry/profiling-node') as {
        nodeProfilingIntegration: () => unknown
      }
      integrations.push(nodeProfilingIntegration())
    } catch {
      // Profiling optional — continue without it.
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
