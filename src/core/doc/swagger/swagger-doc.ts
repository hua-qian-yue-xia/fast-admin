import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger'
import {INestApplication} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'

export const setupSwagger = (app: INestApplication) => {
  const config: ConfigService<Config.Application> = app.get(ConfigService)
  const appConfig = config.get<Config.App>('app')
  const swaggerConfig = config.get<Config.Swagger>('swagger')

  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(appConfig.name)
    .setDescription(appConfig.description)
    .setVersion(appConfig.version)
    .build()

  const document = SwaggerModule.createDocument(app, options, {})
  SwaggerModule.setup(swaggerConfig.pathPrefix, app, document)
}
