import { Delete, Get, Patch, Post, Put } from "@nestjs/common"

export enum ReqMethod {
	Get = "GET",
	Post = "POST",
	Put = "PUT",
	Delete = "DELETE",
	Patch = "PATCH",
}

export const ReqMethodMap = {
	[ReqMethod.Get]: Get,
	[ReqMethod.Post]: Post,
	[ReqMethod.Put]: Put,
	[ReqMethod.Delete]: Delete,
	[ReqMethod.Patch]: Patch,
}

export enum DecoratorKey {
	/**
	 * 日志记录
	 */
	Log = "aspen_log",
	/**
	 * 重复提交
	 */
	RepeatSubmit = "aspen_repeat_submit",
	/**
	 * 限流
	 */
	RateLimit = "aspen_rate_limit",
	/**
	 * 标签
	 */
	Tag = "aspen_tag",
	/**
	 * redis缓存
	 */
	Cache = "aspen_cache",
	/**
	 * 生成字典
	 */
	GenDict = "gen_dict",
}

/**
 * 返回状态码
 */
export enum HttpCodeEnum {
	/**
	 * 成功
	 */
	SUCCESS = 200,
	/**
	 * 未授权
	 */
	UNAUTHORIZED = 401,
	/**
	 * 访问受限，授权过期
	 */
	FORBIDDEN = 403,
	/**
	 * 资源，服务未找到
	 */
	NOT_FOUND = 404,
	/**
	 * 请求超时
	 */
	REQUEST_TIMEOUT = 408,
	/**
	 * 系统内部错误
	 */
	ERROR = 500,
	/**
	 * 接口未实现
	 */
	NOT_IMPLEMENTED = 501,
	/**
	 * 系统警告消息
	 * 前端会显示消息
	 */
	WARN = 601,
}

export type ApiGroup = "admin-save" | "admin-update" | "admin-del" | "app-save" | "app-update" | "app-del" | string

export const EMIT_KEY = {
	// 日志记录事件
	Log: "aspen.log.created",
	// tag接口发现事件
	Tag: "aspen.tag.discovered",
	// 生成字典事件
	GenDict: "gen_dict.created",
}
