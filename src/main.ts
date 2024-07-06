import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ConfigService } from '@nestjs/config'

import { MainModule } from './main.module'

type a = keyof Config.Application

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(MainModule, new FastifyAdapter())
  const config = app.get(ConfigService)
  const appConfig = config.get<Config.App>('app')
  app.setGlobalPrefix(appConfig.prefix)
  await app.listen(appConfig.port)
}

bootstrap()
