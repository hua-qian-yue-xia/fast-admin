import {RedisModule} from '@liaoliaots/nestjs-redis'
import {Global, Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from '@nestjs/config'
import {RedisService} from './redis/redis.service'

function setupRedis() {
  return RedisModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    extraProviders: [RedisService],
    useFactory: (config: ConfigService) => {
      const {host, port, password, db} = config.get<Config.Redis>('redis')
      return {
        config: {
          host: host,
          port: port,
          password: password,
          db: db,
        },
      }
    },
  })
}

@Global()
@Module({
  imports: [setupRedis()],
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}
