import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from './core/cache'
import { DataBaseModule } from './core/data-base'
import { getLocalApplicationConfig } from './core/config'

@Module({
  imports: [
    ConfigModule.forRoot({ load: [getLocalApplicationConfig], isGlobal: true, cache: true }),
    CacheModule,
    DataBaseModule,
  ],
  providers: [],
})
export class MainModule {}
