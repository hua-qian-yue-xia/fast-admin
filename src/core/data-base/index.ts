import { Provider } from '@nestjs/common/interfaces/modules/provider.interface'
import { ConfigService } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { DataSource } from 'typeorm'

export const setupMysqlDataBase = (): Provider => {
  return {
    provide: 'DATA_SOURCE',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const { host, port, username, password, database } = config.get<Config.Database>('database')
      const dataSource = new DataSource({
        type: 'mysql',
        host: host,
        port: port,
        username: username,
        password: password,
        database: database,
      })
      return dataSource.initialize()
    },
  }
}

export const dataBaseProviders = [setupMysqlDataBase()]

@Module({ providers: [...dataBaseProviders], exports: [...dataBaseProviders] })
export class DataBaseModule {}
