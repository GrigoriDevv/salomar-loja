import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import * as Sentry from '@sentry/nestjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

// Load .env before Nest ConfigModule (instrument runs first)
loadEnv({ path: resolve(__dirname, '../.env') })
loadEnv({ path: resolve(__dirname, '../../../.env') })

const dsn = process.env.SENTRY_DSN?.trim()

if (dsn) {
  const tracesSampleRate = Number(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? '1.0',
  )
  const profileSessionSampleRate = Number(
    process.env.SENTRY_PROFILE_SESSION_SAMPLE_RATE ?? '1.0',
  )

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
    integrations: [nodeProfilingIntegration()],
    enableLogs: true,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 1.0,
    profileSessionSampleRate: Number.isFinite(profileSessionSampleRate)
      ? profileSessionSampleRate
      : 1.0,
    profileLifecycle: 'trace',
  })
}
