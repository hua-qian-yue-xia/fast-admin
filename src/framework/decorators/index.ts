import {Module} from '@nestjs/common'
import {APP_INTERCEPTOR, Reflector} from '@nestjs/core'
import {LogInterceptor} from './req/log'
import {SystemModule} from '../../module/_system/system.module'
import {AspenRateLimitInterceptor} from './req/aspen-rate-limit.decorators'

@Module({
  imports: [SystemModule],
  providers: [
    Reflector,
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AspenRateLimitInterceptor,
    },
  ],
})
export class SetupDecoratorModule {}

export {AspenRateLimit} from './req/aspen-rate-limit.decorators'
