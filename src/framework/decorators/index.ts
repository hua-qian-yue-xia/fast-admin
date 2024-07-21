import {Module} from '@nestjs/common'
import {APP_INTERCEPTOR, Reflector} from '@nestjs/core'
import {LogInterceptor} from './req/log'
import {SystemModule} from '../../module/_system/system.module'

@Module({
  imports: [SystemModule],
  providers: [
    Reflector,
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
  ],
})
export class SetupDecoratorModule {}
