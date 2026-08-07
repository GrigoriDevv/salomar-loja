import './instrument'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const origin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173')
  const port = config.get<number>('PORT', 3000)

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

  await app.listen(port, '0.0.0.0')
}

void bootstrap()
