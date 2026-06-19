import { Module, Type } from "@nestjs/common"
import { IEntryNestModule } from "@nestjs/core"
import { ConfigFactory, ConfigModule } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"

import { WinstonLoggerModule } from "../logger/winston-logger-module"
import { RedisCacheModule } from "../cache/redis-module"
import { DatabaseModule } from "../database/database-module"
import { GlobalClsModule } from "../async-storage/cls-module"
import { RedisTool } from "../cache/redis-tool"

@Module({})
export class ApplicationModule {
	private static isRedisEnabled(config: Partial<AspenConf.Application>): boolean {
		const redisConfig = config.redis
		return !!redisConfig?.host?.trim() && redisConfig.port != null && redisConfig.db != null
	}

	private static isDatabaseEnabled(config: Partial<AspenConf.Application>): boolean {
		const databaseConfig = config.database
		return (
			!!databaseConfig?.type &&
			!!databaseConfig.host?.trim() &&
			databaseConfig.port != null &&
			!!databaseConfig.username?.trim() &&
			!!databaseConfig.password?.trim() &&
			!!databaseConfig.database?.trim()
		)
	}

	static forRoot(load: Array<ConfigFactory>, rootModule: Type<any>): IEntryNestModule {
		const entityPattern = `${process.cwd()}/dist/**/*.entity{.ts,.js}`
		const normalized = load.map((l: any) => (typeof l === "function" ? l : () => l))
		const bootstrapConfig = normalized.reduce((config, factory) => {
			return Object.assign(config, factory())
		}, {} as Partial<AspenConf.Application>)

		return {
			global: true,
			module: ApplicationModule,
			imports: [
				// 引入根模块
				rootModule,
				// 引入配置模块(全局)
				ConfigModule.forRoot({ load: normalized }),
				// 引入 Winston 日志模块(全局)
				WinstonLoggerModule.forRoot(),
				// 引入 CLS 异步上下文模块(全局)
				GlobalClsModule.forRoot(),
				// 引入 Redis 缓存模块(全局)
				RedisCacheModule.forRoot({ enabled: this.isRedisEnabled(bootstrapConfig) }),
				// 引入数据库模块(全局)
				DatabaseModule.forRoot({ entityPattern, enabled: this.isDatabaseEnabled(bootstrapConfig) }),
				// 引入事件总线模块(全局)
				EventEmitterModule.forRoot(),
			],
			providers: [],
			exports: [],
		}
	}
}
