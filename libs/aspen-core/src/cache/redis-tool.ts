import { Injectable, Scope } from "@nestjs/common"

import { RedisService } from "@liaoliaots/nestjs-redis"
import Redis from "ioredis"

@Injectable({ scope: Scope.DEFAULT })
export class RedisTool {
	private readonly redis: Redis

	constructor(private readonly redisService: RedisService) {
		this.redis = this.redisService.getOrThrow()
	}

	/**
	 * 设置字符串缓存(单位秒)
	 */
	async set(key: string, val: string, seconds?: number) {
		if (!seconds) return this.redis.set(key, val)
		if (!seconds || seconds <= 0) return this.redis.set(key, val)
		return this.redis.set(key, val, "EX", seconds)
	}

	/**
	 * 获取字符串缓存(单位秒)
	 */
	async get(key: string): Promise<string> {
		if (!key || key === "*") return null
		return this.redis.get(key)
	}

	/**
	 * 删除字符串缓存(单位秒)
	 * 例如:key = "sys:user:id:123"
	 */
	async del(keys: string | Array<string>): Promise<number> {
		if (!keys || keys === "*") return 0
		if (typeof keys === "string") keys = [keys]
		return this.redis.del(...keys)
	}

	/**
	 * 根据通配符删除缓存（使用SCAN，不阻塞）
	 * 例如:pattern = "sys:user:id:*"
	 */
	async delByPattern(patterns: string | Array<string>, count = 1000): Promise<number> {
		const list = typeof patterns === "string" ? [patterns] : patterns
		if (!list || list.length === 0) return 0
		let total = 0
		for (const pattern of list) {
			if (!pattern || pattern === "*") continue
			let cursor = "0"
			do {
				const [next, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", count)
				cursor = next
				if (keys && keys.length) {
					total += await this.redis.del(...keys)
				}
			} while (cursor !== "0")
		}
		return total
	}

	/**
	 * 清空所有缓存
	 */
	async clear() {
		return this.redis.flushdb()
	}

	/**
	 * 获取分布式锁
	 * @param key 锁标识
	 * @param seconds 过期时间(秒)
	 * @returns boolean
	 */
	async tryLock(key: string, seconds = 5): Promise<boolean> {
		const result = await this.redis.set(key, "1", "EX", seconds, "NX")
		return result === "OK"
	}

	/**
	 * 释放分布式锁
	 * @param key 锁标识
	 */
	async unlock(key: string) {
		return this.redis.del(key)
	}
}
