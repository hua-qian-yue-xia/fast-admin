import { Logger } from "@nestjs/common"

import * as _ from "es-toolkit/compat"
import * as ms from "ms"

import { AppCtx, RedisTool } from "@aspen/aspen-core"

import { exception } from "../../exception/exception"

const logger = new Logger("Aspen Cache")

// 工具类型:如果 T 是 Promise 包裹的类型,则提取内部类型,否则返回 T
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

// 修改后的 ReturnType,自动去掉 Promise 包裹
type UnwrappedReturnType<T extends (...args: any[]) => any> = UnwrapPromise<ReturnType<T>>

type CacheBaseValue<T extends (...args: any[]) => any> = (args: Parameters<T>, result: UnwrappedReturnType<T>) => string

type CacheBase<T extends (...args: any[]) => any> = {
	/**
	 * 缓存名,它指定了你的缓存存放在哪块命名空间
	 */
	key: string
	/**
	 * 自定义缓存的key
	 */
	value?: CacheBaseValue<T> | string
}

type CacheableOption<T extends (...args: any[]) => any> = {
	/**
	 * 是否使用异步模式
	 * true: 异步模式
	 * false: 同步模式
	 * @default false
	 */
	async?: boolean
	/**
	 * 过期时间
	 * @default -1
	 */
	expiresIn?: number | ms.StringValue
} & CacheBase<T>

type CachePutOption<T extends (...args: any[]) => any> = {
	/**
	 * 过期时间
	 * @default -1
	 */
	expiresIn?: number | ms.StringValue
} & CacheBase<T>

type CacheEvictOption<T extends (...args: any[]) => any> = {
	/**
	 * 是否删除所有value的缓存
	 * true: 删除所有value的缓存
	 * false: 删除指定的value的缓存
	 * @default false
	 */
	allEntries?: boolean
	/**
	 * 是否在方法执行前就清空
	 * true: 在方法执行前就清空
	 * false: 在方法执行后清空
	 * @default false
	 */
	beforeInvocation?: boolean
} & CacheBase<T>

function parseCacheKeyExpressions<T extends (...args: any[]) => any>(
	expressions: CacheBaseValue<T> | string,
	args: Parameters<T>,
	result: UnwrappedReturnType<T>,
): string | null {
	if (_.isEmpty(expressions)) return null
	if (typeof expressions == "string") return expressions
	try {
		const key = expressions(args, result)
		return key
	} catch (error) {
		logger.error("解析缓存key表达式失败error:", error)
		return null
	}
}

// 解析缓存过期时间
function parseExpiresIn(expiresIn?: number | ms.StringValue): number {
	if (_.isEmpty(expiresIn)) return -1
	if (typeof expiresIn == "number") {
		return expiresIn <= 0 ? -1 : expiresIn
	}
	const msValue = ms(expiresIn)
	return msValue <= 0 ? -1 : msValue / 1000
}

const getRedisTool = async (): Promise<RedisTool> => {
	try {
		return AppCtx.getBean(RedisTool)
	} catch (error) {
		throw new exception.core(`获取RedisTool失败error:|${error}|`)
	}
}

/**
 * 根据方法对其返回结果进行缓存,下次请求时,如果缓存存在,则直接读取缓存数据返回;如果缓存不存在,则执行方法,并把返回的结果存入缓存中
 * 一般用在查询方法上
 */
function AspenCacheable<T extends (...args: any[]) => any>(cacheables: CacheableOption<T> | Array<CacheableOption<T>>) {
	return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
		const originalMethod = descriptor.value
		descriptor.value = async function (...args: Parameters<T>) {
			if (_.isEmpty(cacheables)) return originalMethod.apply(this, args)
			// 处理缓存流程
			const redisTool = await getRedisTool()
			if (!redisTool) return originalMethod.apply(this, args)
			const list = Array.isArray(cacheables) ? cacheables : [cacheables]
			// 同步
			const cacheList: Array<Omit<CacheableOption<T>, "value">> = []
			for (let i = 0; i < list.length; i++) {
				const v = list[i]
				const cacheValue = parseCacheKeyExpressions(v.value, args, {} as UnwrappedReturnType<T>)
				if (_.isEmpty(cacheValue)) continue
				const fullPath = v.key == undefined ? cacheValue : `${v.key}:${cacheValue}`
				// 处理过期时间
				const expiresIn = parseExpiresIn(v.expiresIn)
				cacheList.push({ key: fullPath, async: v.async ?? false, expiresIn: expiresIn })
			}
			// 查找缓存
			for (let i = 0; i < cacheList.length; i++) {
				const cacheResult = await redisTool.get(cacheList[i].key)
				if (!_.isEmpty(cacheResult)) {
					logger.debug(`cache.able缓存命中key|${cacheList[i].key}|value|${cacheResult}`)
					return typeof cacheResult == "string" ? JSON.parse(cacheResult) : cacheResult
				}
			}
			// 执行方法,获取结果
			const result = await originalMethod.apply(this, args)
			if (result == undefined) return result
			// 异步缓存结果
			const asyncList = cacheList.filter((i) => i.async)
			if (asyncList.length > 0) {
				Promise.allSettled(asyncList.map((i) => redisTool.set(i.key, JSON.stringify(result), i.expiresIn as number)))
			}
			// 同步缓存结果
			const syncList = cacheList.filter((i) => !i.async)
			if (syncList.length > 0) {
				await Promise.allSettled(syncList.map((i) => redisTool.set(i.key, JSON.stringify(result), i.expiresIn as number)))
			}
			return result
		} as T
		return descriptor
	}
}

/**
 * 使用该注解标志的方法,每次都会执行,并将结果存入指定的缓存中.其他方法可以直接从响应的缓存中读取缓存数据,而不需要再去查询数据库
 * 一般用在新增方法上
 */
function AspenCachePut<T extends (...args: any[]) => any>(cachePuts: CachePutOption<T> | Array<CachePutOption<T>>) {
	return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
		const originalMethod = descriptor.value
		descriptor.value = async function (...args: Parameters<T>) {
			if (_.isEmpty(cachePuts)) return originalMethod.apply(this, args)
			// 处理缓存流程
			const redisTool = await getRedisTool()
			if (!redisTool) return originalMethod.apply(this, args)
			const list = Array.isArray(cachePuts) ? cachePuts : [cachePuts]
			const cacheList: Array<Omit<CachePutOption<T>, "value">> = []
			// 执行方法,获取结果
			const result = await originalMethod.apply(this, args)
			if (result == undefined) return result
			for (let i = 0; i < list.length; i++) {
				const v = list[i]
				const cacheValue = parseCacheKeyExpressions(v.value, args, result as UnwrappedReturnType<T>)
				if (_.isEmpty(cacheValue)) continue
				const fullPath = v.key == undefined ? cacheValue : `${v.key}:${cacheValue}`
				// 处理过期时间
				const expiresIn = parseExpiresIn(v.expiresIn)
				cacheList.push({ key: fullPath, expiresIn: expiresIn })
			}
			// 设置缓存
			await Promise.allSettled(
				cacheList.map((i) => {
					logger.debug(`cache.put缓存key|${i.key}|过期时间|${i.expiresIn}秒`)
					return redisTool.set(i.key, JSON.stringify(result), i.expiresIn as number)
				}),
			)
			return result
		} as T
		return descriptor
	}
}

/**
 * 使用该注解标志的方法,会清空指定的缓存
 * 一般用在更新或者删除方法上
 */
function AspenCacheEvict<T extends (...args: any[]) => any>(cacheEvicts: CacheEvictOption<T> | Array<CacheEvictOption<T>>) {
	return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
		const originalMethod = descriptor.value
		descriptor.value = async function (...args: Parameters<T>) {
			if (_.isEmpty(cacheEvicts)) return originalMethod.apply(this, args)
			// 处理缓存流程
			const redisTool = await getRedisTool()
			if (!redisTool) return originalMethod.apply(this, args)
			const list = Array.isArray(cacheEvicts) ? cacheEvicts : [cacheEvicts]
			const cacheList: Array<Omit<CacheEvictOption<T>, "value">> = []
			for (let i = 0; i < list.length; i++) {
				const v = list[i]
				const cacheValue = parseCacheKeyExpressions(v.value, args, {} as UnwrappedReturnType<T>)
				if (_.isEmpty(cacheValue)) continue
				let fullPath = v.key == undefined ? cacheValue : `${v.key}:${cacheValue}`
				// 是否全部删除
				if (!_.isEmpty(v.allEntries) && v.allEntries && !_.isEmpty(v.key)) {
					fullPath = `${v.key}:*`
				}
				cacheList.push({ key: fullPath, beforeInvocation: v.beforeInvocation ?? false })
			}
			// 在方法执行前就清空
			const beforeList = cacheList.filter((i) => i.beforeInvocation)
			if (beforeList.length > 0) {
				await Promise.allSettled(beforeList.map((i) => redisTool.del(i.key)))
			}
			// 执行方法,获取结果
			const result = await originalMethod.apply(this, args)
			// 在方法执行后清空
			const afterList = cacheList.filter((i) => !i.beforeInvocation)
			if (afterList.length > 0) {
				await Promise.allSettled(afterList.map((i) => redisTool.del(i.key)))
			}
			return result
		} as T
		return descriptor
	}
}

export const cache = {
	able: AspenCacheable,
	put: AspenCachePut,
	evict: AspenCacheEvict,
}
