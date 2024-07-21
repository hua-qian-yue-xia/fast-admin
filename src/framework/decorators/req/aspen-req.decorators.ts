import { Delete, Get, HttpCode, Patch, Post, Put, applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

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
   * @summary 是否生成日志信息
   * @default true
   */
  isLogger?: boolean
  /**
   * @summary 是否生成接口文档
   * @default true
   */
  isDoc?: boolean
}

export const AspenReq = (options: AspenReqOption) => {
  const { summary, description, method, path } = options
  const list = [ApiOperation({ summary: summary, description: description }), MethodMap[method](path), HttpCode(200)]

  return applyDecorators(...list)
}
