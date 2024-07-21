import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'

import { MainModule } from './main.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(MainModule, new FastifyAdapter())
  const config: ConfigService<Config.Application> = app.get(ConfigService)
  const appConfig = config.get<Config.App>('app')
  app.setGlobalPrefix(appConfig.prefix)
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  await app.listen(appConfig.port)
}

bootstrap()
