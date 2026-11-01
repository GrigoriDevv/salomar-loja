import './instrument'
import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { configureApp, parseOrigins } from './bootstrap/configure-app'
import { assertProductionEnv } from './bootstrap/production-env'

async function bootstrap() {
  assertProductionEnv(process.env)
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const port = config.get<number>('PORT', 3000)
  const origins = parseOrigins(config.get<string>('CORS_ORIGIN'))
  if (!origins.length) {
    new Logger('Bootstrap').warn('CORS_ORIGIN vazio: o navegador não consegue chamar a API')
  }

  configureApp(app, {
    origins,
    trustProxy: Number(config.get<string>('TRUST_PROXY') ?? 0),
  })

  await app.listen(port, '0.0.0.0')
}

void bootstrap()
