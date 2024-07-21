import {CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata} from '@nestjs/common'
import {Observable, tap, catchError, throwError, finalize} from 'rxjs'
import {ModuleRef, Reflector} from '@nestjs/core'
import {FastifyRequest} from 'fastify'

import {ComChangLogEntity} from '../../../module/_common/entity/com-chang-log.entity'
import {HttpStatusConstant} from '../../constant/http-constant'
import {ComChangLogService} from '../../../module/_common/service/com-chang-log.service'

export const LOG = 'Log'

export type LogOption = {
  /**
   * @summar 定义该接口的摘要信息
   */
  summary: string
}

export const Log = (option: LogOption) => SetMetadata(LOG, option)

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const logEntity = new ComChangLogEntity()
    const beforeTime = new Date()

    const req = ctx.switchToHttp().getRequest<FastifyRequest>()
    const handler = ctx.getHandler()
    const logOption: LogOption = this.reflector.get<LogOption>(LOG, handler)
    const {method, url, ip, params = {}, body = {}} = req
    const {summary} = logOption

    logEntity.createTime = beforeTime
    logEntity.logTitle = summary
    logEntity.reqUrl = url
    logEntity.reqMethod = method
    logEntity.reqJson = JSON.stringify({params, body}).slice(0, 2000)
    logEntity.reqIp = ip
    logEntity.reqLocation = '未知'
    logEntity.logType = '1'

    return next.handle().pipe(
      tap(data => {
        logEntity.costTime = Date.now() - beforeTime.getTime()
        logEntity.resJson = JSON.stringify(data).slice(0, 2000)
        logEntity.status = HttpStatusConstant.SUCCESS
      }),
      catchError(err => {
        logEntity.costTime = Date.now() - beforeTime.getTime()
        logEntity.errorJson = JSON.stringify(err.message).slice(0, 2000)
        logEntity.status = HttpStatusConstant.ERROR
        return throwError(err)
      }),
      finalize(async () => {
        await this.saveLog(logEntity)
      }),
    )
  }

  // todo 数据量大了可以加消息队列
  async saveLog(data: ComChangLogEntity) {
    const comChangLogService = this.moduleRef.get(ComChangLogService, {strict: false})
    await comChangLogService.add(data)
  }
}
