import {CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata} from '@nestjs/common'
import {Observable, tap, catchError, throwError, finalize} from 'rxjs'
import {ModuleRef, Reflector} from '@nestjs/core'
import {FastifyRequest} from 'fastify'

import {ComChangLogEntity} from '../../../module/_common/entity/com-chang-log.entity'
import {HttpStatusConstant} from '../../constant/http-constant'
import {ComChangLogService} from '../../../module/_common/service/com-chang-log.service'
import {SysLogType} from '../../constant/sys-constant'

export const ASPEN_LOG = 'aspen_log'

export type LogOption = {
  /**
   * 定义该接口的摘要信息
   */
  summary: string
  /**
   * @see SysLogType
   */
  type: SysLogType
  /**
   * 是否保存请求的参数
   * @default true
   */
  isSaveRequestData: boolean
  /**
   * 是否保存响应的参数
   * @default true
   */
  isSaveResponseData: boolean
}

export const Log = (option: LogOption) => SetMetadata(ASPEN_LOG, option)

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const handler = ctx.getHandler()
    const logOption: LogOption = this.reflector.get<LogOption>(ASPEN_LOG, handler)
    if (!logOption) {
      return next.handle()
    }

    const logEntity = new ComChangLogEntity()
    const beforeTime = new Date()

    const req = ctx.switchToHttp().getRequest<FastifyRequest>()
    const {method, url, ip, params = {}, body = {}} = req
    const {summary, type, isSaveRequestData = true, isSaveResponseData = true} = logOption

    logEntity.createTime = beforeTime
    logEntity.logTitle = summary
    logEntity.reqUrl = url
    logEntity.reqMethod = method
    if (isSaveRequestData) {
      logEntity.reqJson = JSON.stringify({params, body}).slice(0, 2000)
    }
    logEntity.reqIp = ip
    logEntity.reqLocation = '未知'
    logEntity.logType = type

    return next.handle().pipe(
      tap(data => {
        logEntity.costTime = Date.now() - beforeTime.getTime()
        if (isSaveResponseData) {
          logEntity.resJson = JSON.stringify(data).slice(0, 2000)
        }
        logEntity.status = HttpStatusConstant.SUCCESS
      }),
      catchError(err => {
        logEntity.costTime = Date.now() - beforeTime.getTime()
        if (isSaveResponseData) {
          logEntity.errorJson = JSON.stringify(err.message).slice(0, 2000)
        }
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
