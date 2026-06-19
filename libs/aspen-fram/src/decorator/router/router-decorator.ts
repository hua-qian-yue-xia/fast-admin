import { applyDecorators, Controller, Type } from "@nestjs/common"

import { ApiOperation, ApiTags, ApiOkResponse, ApiExtraModels, getSchemaPath, ApiProperty } from "@nestjs/swagger"

import { R } from "../../base/base-result"
import { BasePageVo } from "../../base/base-page"
import { ReqMethod, ReqMethodMap } from "../../constant"

import { TagType, AspenTag } from "../tag/tag-decorator"
import { AspenRateLimit, RateLimitOption } from "../repeat-submit/repeat-submit-decorator"
import { AspenLog, LogOption } from "../log/log-decorator"

/******************** start type start ********************/

type CreateReqOptions = {
	/**
	 * 接口作用描述
	 */
	summary: string
	/**
	 * 接口作用详细描述
	 */
	description?: string
	/**
	 * 接口返回值描述
	 */
	resType?: {
		/**
		 * 接口返回值类型
		 */
		type: Type<unknown>
		/**
		 * 返回包装类型
		 * @default "none"
		 */
		wrapper?: "none" | "list" | "page" | "tree"
	}
	/**
	 * 接口路由地址
	 */
	router: string
	/**
	 * 接口类型
	 */
	method: ReqMethod
	/**
	 * 日志配置信息
	 */
	log?: Omit<LogOption, "summary">
	/**
	 * 限流配置信息
	 */
	rateLimit?: RateLimitOption
	/**
	 * 是否需要token
	 * @default null
	 */
	tagList?: Array<TagType>
}

type AspenControllerOptions = {
	/**
	 * 控制器作用描述
	 */
	summary: string
	/**
	 * 控制器路由path前缀
	 */
	prefix: string | string[]
}

type MethodReqOptions = Omit<CreateReqOptions, "method">

/******************** end type end ********************/

// 用于树状结构的递归 children 模型：为所有层级统一增加 children 属性
class SwaggerTreeNode {
	@ApiProperty({ type: () => [SwaggerTreeNode], description: "子节点", default: [] })
	children: any[]
}

function createReqDecorators(options: CreateReqOptions) {
	const { summary, description, router, resType, method, log, rateLimit, tagList = null } = options
	const { type, wrapper = "none" } = resType ?? {}

	const decorators = [ReqMethodMap[method](router)]
	const swagger = [ApiOperation({ summary: summary, description: description })]
	if (tagList) {
		decorators.push(AspenTag(tagList))
	}
	if (type) {
		if (wrapper === "page") {
			swagger.push(
				...[
					ApiExtraModels(type, BasePageVo, R),
					ApiOkResponse({
						schema: {
							allOf: [
								{ $ref: getSchemaPath(R) },
								{
									properties: {
										data: {
											type: "object",
											allOf: [
												{ $ref: getSchemaPath(BasePageVo) },
												{
													properties: {
														records: {
															type: "array",
															items: { $ref: getSchemaPath(type) },
														},
													},
												},
											],
										},
									},
								},
							],
						},
					}),
				],
			)
		} else if (wrapper === "list") {
			swagger.push(
				...[
					ApiExtraModels(type, R),
					ApiOkResponse({
						schema: {
							allOf: [
								{ $ref: getSchemaPath(R) },
								{
									properties: {
										data: {
											type: "array",
											items: { $ref: getSchemaPath(type) },
										},
									},
								},
							],
						},
					}),
				],
			)
		} else if (wrapper === "tree") {
			swagger.push(
				...[
					ApiExtraModels(type, R, SwaggerTreeNode),
					ApiOkResponse({
						schema: {
							allOf: [
								{ $ref: getSchemaPath(R) },
								{
									properties: {
										data: {
											type: "array",
											items: {
												allOf: [{ $ref: getSchemaPath(type) }, { $ref: getSchemaPath(SwaggerTreeNode) }],
											},
										},
									},
								},
							],
						},
					}),
				],
			)
		} else {
			swagger.push(
				...[
					ApiExtraModels(type, R),
					ApiOkResponse({
						schema: {
							allOf: [
								{ $ref: getSchemaPath(R) },
								{
									properties: {
										data: {
											type: "object",
											allOf: [{ $ref: getSchemaPath(type) }],
										},
									},
								},
							],
						},
					}),
				],
			)
		}
	}
	decorators.push(...swagger)
	if (log) {
		const logOptions: LogOption = {
			summary,
			...log,
		}
		decorators.push(AspenLog(logOptions))
	}
	if (rateLimit) {
		decorators.push(AspenRateLimit(rateLimit))
	}
	return applyDecorators(...decorators)
}

const AspenGet = (options: MethodReqOptions) => {
	return createReqDecorators({ ...options, method: ReqMethod.Get })
}

const AspenPost = (options: MethodReqOptions) => {
	return createReqDecorators({ ...options, method: ReqMethod.Post })
}

const AspenPut = (options: MethodReqOptions) => {
	return createReqDecorators({ ...options, method: ReqMethod.Put })
}

const AspenDelete = (options: MethodReqOptions) => {
	return createReqDecorators({ ...options, method: ReqMethod.Delete })
}

const AspenPatch = (options: MethodReqOptions) => {
	return createReqDecorators({ ...options, method: ReqMethod.Patch })
}

const AspenController = (options: AspenControllerOptions) => {
	const { summary, prefix } = options
	const decorators = [Controller(prefix), ApiTags(summary)]
	return applyDecorators(...decorators)
}

export const router = {
	controller: AspenController,
	get: AspenGet,
	post: AspenPost,
	put: AspenPut,
	delete: AspenDelete,
	patch: AspenPatch,
}
