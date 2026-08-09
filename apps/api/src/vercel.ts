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

async function bootstrap(): Promise<express.Express> {
  if (cachedServer) return cachedServer

  const server = express()
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: true,
  })
  const config = app.get(ConfigService)
  const origin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173')

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
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrap()
  return server(req, res)
}

export { cachedApp }
