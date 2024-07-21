import {ConfigModule, ConfigService} from '@nestjs/config'
import {Module} from '@nestjs/common'
import {TypeOrmModule} from '@nestjs/typeorm'

function setupMysql() {
  return TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const {host, port, username, password, database} = config.get<Config.Database>('database')
      return {
        type: 'mysql',
        host: host,
        port: port,
        username: username,
        password: password,
        database: database,
        synchronize: true,
        entities: ['dist/**/*.entity.{ts,js}'],
        autoLoadEntities: true,
      }
    },
  })
}

@Module({imports: [setupMysql()]})
export class DataBaseModule {}
