import { Readable } from "node:stream"

import { CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata } from "@nestjs/common"
import { FastifyReply, FastifyRequest } from "fastify"
import { Reflector } from "@nestjs/core"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { catchError, finalize, Observable, tap, throwError } from "rxjs"
import { isBlob, isBuffer, isFile, isPlainObject } from "es-toolkit"

import { tool } from "@aspen/aspen-core"

import { DecoratorKey, EMIT_KEY } from "../../constant/index"

/******************** start type start ********************/

export type LogOption = {
	/**
	 * 定义该接口的摘要信息
	 */
	summary: string
	/**
	 * 接口tag
	 * @see ReqTag
	 */
	tag: "OTHER" | "INSERT" | "UPDATE" | "DELETE" | "GRANT" | "EXPORT" | "IMPORT" | "GENERATE" | "ADMIN"
	/**
	 * 是否保存请求的参数
	 * @define true
	 */
	isSaveRequestData?: boolean
	/**
	 * 是否保存响应的参数
	 * @define true
	 */
	isSaveResponseData?: boolean
}

/******************** end type end ********************/

const defaultLogOption: Pick<LogOption, "isSaveRequestData" | "isSaveResponseData"> = {
	isSaveRequestData: true,
	isSaveResponseData: true,
}

export const AspenLog = (option: LogOption) => SetMetadata(DecoratorKey.Log, { ...defaultLogOption, ...option })

export type AspenLogRecord = {
	tag: string
	summary: string
	description?: string

	reqParams?: string
	reqBody?: string
	resBody?: string

	errorMsg?: string
	errorStack?: string

	cost: number
	httpCode: number

	ip?: string
	headers?: string

	uri: string
	uriMethod: string

	createTime?: Date
}

export interface AspenLogChange {
	saveLogger: (options: LogOption, request: FastifyRequest, res: any, error: any) => void
}

// Node.js 原生可读流.
const isReadableStream = (value: unknown): value is Readable => {
	return value instanceof Readable
}

// 兼容实现了 pipe() 的流式对象.
const isStreamLikeObject = (value: unknown): value is { pipe: (...args: Array<any>) => any } => {
	return typeof value === "object" && value !== null && typeof (value as { pipe?: unknown }).pipe === "function"
}

// 兼容 Nest StreamableFile 这类通过 getStream() 暴露流的对象.
const isStreamableFileLike = (value: unknown): value is { getStream: () => unknown } => {
	return typeof value === "object" && value !== null && typeof (value as { getStream?: unknown }).getStream === "function"
}

// 兼容常见上传文件对象,只记录文件元信息,不记录文件内容本身.
const isUploadFileLikeObject = (
	value: unknown,
): value is { filename?: string; mimetype?: string; encoding?: string; file?: unknown; filepath?: string } => {
	if (!isPlainObject(value)) {
		return false
	}
	const file = value as Record<string, any>
	return (
		typeof file.filename === "string" ||
		typeof file.mimetype === "string" ||
		typeof file.encoding === "string" ||
		typeof file.filepath === "string" ||
		isReadableStream(file.file) ||
		isStreamLikeObject(file.file)
	)
}

// 统一做安全序列化,流,文件,二进制对象只记录元信息,避免日志对象过大或中断主流程.
const stringifySafe = (value: any): string | undefined => {
	if (value == null) {
		return undefined
	}
	if (isBuffer(value)) {
		return `[Buffer length=${value.length}]`
	}
	if (isBlob(value)) {
		return `[Blob size=${value.size} type=${value.type || "unknown"}]`
	}
	if (isFile(value)) {
		return `[File name=${value.name} size=${value.size} type=${value.type || "unknown"}]`
	}
	if (isReadableStream(value) || isStreamLikeObject(value)) {
		return "[ReadableStream]"
	}
	if (isStreamableFileLike(value)) {
		return "[StreamableFile]"
	}
	if (isUploadFileLikeObject(value)) {
		return `[UploadFile filename=${value.filename ?? "unknown"} mimetype=${value.mimetype ?? "unknown"} encoding=${value.encoding ?? "unknown"}]`
	}
	try {
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}

@Injectable()
export class AspenLogInterceptor implements NestInterceptor {
	constructor(
		private readonly reflector: Reflector,
		private readonly eventEmitter: EventEmitter2,
	) {}

	intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
		const logOption = this.reflector.get<LogOption>(DecoratorKey.Log, ctx.getHandler())
		if (!logOption) return next.handle()
		const request = ctx.switchToHttp().getRequest<FastifyRequest>()
		const reply = ctx.switchToHttp().getResponse<FastifyReply>()
		const startTime = Date.now()
		let responseData: any
		let errorData: any

		return next.handle().pipe(
			tap((res) => {
				// 成功响应体在 finalize 阶段统一写入日志.
				responseData = res
			}),
			catchError((error) => {
				// 异常不在这里吞掉,只缓存后继续向上抛出.
				errorData = error
				return throwError(() => error)
			}),
			finalize(() => {
				// 拦截器只负责采集统一日志模型并发布事件,真正的存储由业务模块自行监听处理.
				const record: AspenLogRecord = {
					tag: logOption.tag,
					summary: logOption.summary,
					reqParams: logOption.isSaveRequestData ? tool.str.truncateMiddle(stringifySafe(request.query)) : undefined,
					reqBody: logOption.isSaveRequestData ? tool.str.truncateMiddle(stringifySafe(request.body)) : undefined,
					resBody: logOption.isSaveResponseData ? tool.str.truncateMiddle(stringifySafe(responseData)) : undefined,
					errorMsg: errorData?.message,
					errorStack: errorData?.stack,
					cost: Date.now() - startTime,
					httpCode: errorData?.status ?? errorData?.statusCode ?? reply.statusCode,
					ip: request.ip,
					headers: stringifySafe(request.headers),
					uri: request.url,
					uriMethod: request.method,
					createTime: new Date(),
				}

				this.eventEmitter.emit(EMIT_KEY.Log, record)
			}),
		)
	}
}
