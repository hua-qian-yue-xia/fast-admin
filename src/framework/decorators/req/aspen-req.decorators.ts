import {Delete, Get, HttpCode, Patch, Post, Put, applyDecorators} from '@nestjs/common'
import {ApiOperation, ApiResponse} from '@nestjs/swagger'
import {Log, LogOption} from './log'
import {SysLogType} from '../../constant/sys-constant'
import {Anonymous} from './anonymous.decorators'

export enum Method {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
  Patch = 'PATCH',
}

export const MethodMap = {
  [Method.Get]: Get,
  [Method.Post]: Post,
  [Method.Put]: Put,
  [Method.Delete]: Delete,
  [Method.Patch]: Patch,
}

export type AspenReqOption = {
  /**
   * @summar 定义该接口的摘要信息
   */
  summary?: string
  /**
   * @summar 定义该接口的描述信息
   */
  description?: string
  /**
   * @summary 定义该接口的路由路径
   */
  path?: string
  /**
   * @summary 定义该接口的请求方式
   * @default Get
   */
  method?: Method
  /**
   * 是否生成日志信息
   * @default false
   */
  isLog?: boolean
  /**
   * 日志配置
   */
  logOption?: Omit<LogOption, 'summary'>
  /**
   * 是否生成接口文档
   * @default true
   */
  isDoc?: boolean
  /**
   * 是否匿名访问不鉴权
   * @default false
   */
  isAnonymous?: boolean
}

export type DocOption = {}

export const AspenReq = (options: AspenReqOption) => {
  const {summary, description = '', method, path, isLog = false, isAnonymous = false, isDoc = true, logOption} = options
  const list = [MethodMap[method](path), HttpCode(200)]
  if (isLog) {
    const logOptions: LogOption = {
      summary: summary,
      isSaveRequestData: logOption?.isSaveRequestData ?? true,
      isSaveResponseData: logOption?.isSaveResponseData ?? true,
      type: logOption?.type ?? SysLogType.OTHER,
    }
    list.push(Log(logOptions))
  }
  if (isAnonymous) {
    list.push(Anonymous())
  }
  if (isDoc) {
    list.push(ApiOperation({summary: summary, description: description}))
  }
  return applyDecorators(...list)
}

export const AspenGet = (options: Omit<AspenReqOption, 'method'>) => {
  return AspenReq({method: 'GET', ...options} as AspenReqOption)
}

export const AspenPost = (options: Omit<AspenReqOption, 'method'>) => {
  return AspenReq({method: 'POST', ...options} as AspenReqOption)
}

export const AspenPut = (options: Omit<AspenReqOption, 'method'>) => {
  return AspenReq({method: 'PUT', ...options} as AspenReqOption)
}

export const AspenDelete = (options: Omit<AspenReqOption, 'method'>) => {
  return AspenReq({method: 'DELETE', ...options} as AspenReqOption)
}
