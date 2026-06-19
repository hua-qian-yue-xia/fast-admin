import { ConfigModule, ConfigService } from "@nestjs/config"
import { DynamicModule, Global, Logger, Module } from "@nestjs/common"

import { RedisModule, RedisModuleOptions } from "@liaoliaots/nestjs-redis"

import { RedisTool } from "./redis-tool"

export const REDIS_TAG = "redis"

export type RedisCacheModuleOptions = {
	/**
	 * 是否启用 Redis 模块
	 */
	enabled: boolean
}

@Global()
@Module({})
export class RedisCacheModule {
	static forRoot(options: RedisCacheModuleOptions): DynamicModule {
		if (!options.enabled) {
			return {
				global: true,
				module: RedisCacheModule,
			}
		}

		return {
			global: true,
			module: RedisCacheModule,
			imports: [
				ConfigModule,
				RedisModule.forRootAsync({
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: async (config: ConfigService<AspenConf.Application, true>): Promise<RedisModuleOptions> => {
						const logger = new Logger(REDIS_TAG)
						const redisConfig = config.get("redis", { infer: true })

						if (!redisConfig) {
							logger.warn("未找到 redis 配置，跳过 Redis 连接初始化")
							return {}
						}

						const missingFields = [
							!redisConfig.host?.trim() ? "redis.host" : null,
							redisConfig.port == null ? "redis.port" : null,
							redisConfig.db == null ? "redis.db" : null,
						].filter(Boolean)

						if (missingFields.length > 0) {
							return {}
						}
						logger.debug(
							`连接redis参数host:<${redisConfig.host}>port:<${redisConfig.port}>password:<${redisConfig.password}>db:<${redisConfig.db}>`,
						)
						return {
							config: {
								host: redisConfig.host,
								port: redisConfig.port,
								password: redisConfig.password,
								db: redisConfig.db,
							},
						}
					},
				}),
			],
			providers: [RedisTool],
			exports: [RedisTool],
		}
	}
}
