import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'

import { MainModule } from './main.module'
import { getLocalApplicationConfig } from './core/config'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(MainModule, new FastifyAdapter())
  await app.listen(3000)
}

bootstrap()
