import {CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata} from '@nestjs/common'
import {Observable} from 'rxjs'
import {Reflector} from '@nestjs/core'
import {HttpLimitEnum} from '../../constant/http-constant'
import {RedisService} from '../../../core/cache/redis/redis.service'
import {FastifyRequest} from 'fastify'
import {SysRedisConstant} from '../../constant/sys-constant'

export const ASPEN_RATE_LIMIT = 'aspen_rate_limit'

export type AspenRateLimitOption = {
  /**
   * 限流时间,单位秒
   * @default 60
   */
  time?: number
  /**
   * 限流次数
   * @default 100
   */
  count?: number
  /**
   * 限流类型
   * @see HttpLimitEnum
   * @default DEFAULT
   */
  limitType?: HttpLimitEnum
}

const limitScriptText = `
local key = KEYS[1]
local count = tonumber(KEYS[2])
local time = tonumber(KEYS[3])
local current = redis.call('get', key) or 0;
if current and tonumber(current) > count then
    return tonumber(current);
end
current = redis.call('incr', key);
if tonumber(current) == 1 then
    redis.call('expire', key, time); 
end
return tonumber(current);
`

const defaultAspenRateLimitOption: AspenRateLimitOption = {
  time: 60,
  count: 100,
  limitType: HttpLimitEnum.DEFAULT,
}

export const AspenRateLimit = (option?: AspenRateLimitOption) => {
  if (!option) {
    option = {...defaultAspenRateLimitOption}
  }
  return SetMetadata(ASPEN_RATE_LIMIT, option)
}

@Injectable()
export class AspenRateLimitInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private redisServer: RedisService,
  ) {}

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any> | Observable<Observable<any>>> {
    const handler = ctx.getHandler()
    const option: AspenRateLimitOption = this.reflector.get<AspenRateLimitOption>(ASPEN_RATE_LIMIT, handler)
    if (!option) {
      return next.handle()
    }
    const {time, count, limitType} = option
    try {
      const key = this.getKey(ctx, limitType!)
      const number = await this.redisServer.getClient().eval(limitScriptText, 3, key, count, time)
      if (typeof number === 'number') {
        if (number >= count) {
          throw new Error()
        }
      }
    } catch (error) {
      console.log(error)
    }
    return next.handle()
  }

  getKey(ctx: ExecutionContext, type: HttpLimitEnum): string {
    let key = SysRedisConstant.RATE_LIMIT_KEY
    const handler = ctx.getHandler()
    const target = ctx.getClass()
    key = key.concat(`${target.name}:${handler.name}`)
    if (type === HttpLimitEnum.IP) {
      const req = ctx.switchToHttp().getRequest<FastifyRequest>()
      key = type.concat(':').concat(req.ip)
    }
    return key
  }
}
