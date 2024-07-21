import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {CacheModule} from './core/cache'
import {DataBaseModule} from './core/data-base'
import {getLocalApplicationConfig} from './core/config'
import {AuthModule} from './core/auth'
import {adminRouter} from './controller/router'
import {InitModule} from './framework/init'
import {AuthGuard} from './framework/guard/auth.guard'
import {APP_GUARD} from '@nestjs/core'
import {SetupDecoratorModule} from './framework/decorators'

@Module({
  imports: [
    ConfigModule.forRoot({load: [getLocalApplicationConfig], isGlobal: true, cache: true}),
    CacheModule,
    DataBaseModule,
    AuthModule,
    InitModule,
    SetupDecoratorModule,
  ],
  controllers: [...adminRouter],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class MainModule {}
