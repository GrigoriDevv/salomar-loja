import './instrument'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import type { Request, Response } from 'express'
import express from 'express'
import { AppModule } from './app.module'

let cachedApp: INestApplication | null = null
let cachedServer: express.Express | null = null
let bootstrapError: Error | null = null

const DEFAULT_CORS =
  'https://salomar-loja-web.vercel.app,http://localhost:5173'

function corsOrigins(): string[] {
  return (process.env.CORS_ORIGIN?.trim() || DEFAULT_CORS)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function applyCors(req: Request, res: Response) {
  const origin = req.headers.origin
  const allowed = corsOrigins()
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Content-Type,Authorization',
  )
}

async function bootstrap(): Promise<express.Express> {
  if (cachedServer) return cachedServer
  if (bootstrapError) throw bootstrapError

  try {
    const server = express()
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      bodyParser: true,
    })
    const config = app.get(ConfigService)
    const origin = config.get<string>('CORS_ORIGIN')?.trim() || DEFAULT_CORS

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )

    app.enableCors({
      origin: origin.split(',').map((value) => value.trim()),
      credentials: true,
    })

    await app.init()
    cachedApp = app
    cachedServer = server
    return server
  } catch (err) {
    bootstrapError = err instanceof Error ? err : new Error(String(err))
    throw bootstrapError
  }
}

function stripApiPrefix(req: Request) {
  // Rewrites send /health → /api/health; Nest controllers are mounted at /health.
  const url = req.url ?? '/'
  if (url === '/api' || url.startsWith('/api?')) {
    req.url = url.replace(/^\/api/, '/') || '/'
    return
  }
  if (url.startsWith('/api/')) {
    req.url = url.slice('/api'.length) || '/'
  }
}

export default async function handler(req: Request, res: Response) {
  stripApiPrefix(req)

  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    res.end()
    return
  }

  try {
    const server = await bootstrap()
    return server(req, res)
  } catch (err) {
    applyCors(req, res)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'bootstrap_failed',
        message: err instanceof Error ? err.message : String(err),
      }),
    )
  }
}

export { cachedApp }
