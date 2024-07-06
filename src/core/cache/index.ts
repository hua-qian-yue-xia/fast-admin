import { RedisModule } from '@liaoliaots/nestjs-redis'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { host, port, password, db } = config.get<Config.Redis>('redis')
        return {
          config: {
            host: host,
            port: port,
            password: password,
            db: db,
          },
        }
      },
    }),
  ],
})
export class CacheModule {
}
