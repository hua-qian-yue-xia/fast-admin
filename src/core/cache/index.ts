import { RedisModule } from '@liaoliaots/nestjs-redis'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RedisService } from './redis/redis.service'

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      extraProviders: [RedisService],
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
export class CacheModule {}
