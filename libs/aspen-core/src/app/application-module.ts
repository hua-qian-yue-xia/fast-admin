import { Module, Type } from "@nestjs/common"
import { IEntryNestModule } from "@nestjs/core"
import { ConfigFactory, ConfigModule } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"

import { WinstonLoggerModule } from "../logger/winston-logger-module"
import { RedisCacheModule } from "../cache/redis-module"
import { DatabaseModule } from "../database/database-module"
import { GlobalClsModule } from "../async-storage/cls-module"
import { PrometheusModule } from "../prometheus/prometheus-module"
import { TempoModule } from "../tempo/tempo-module"

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

	private static isTempoEnabled(config: Partial<AspenConf.Application>): boolean {
		return !!config.tempo?.enabled
	}

	private static isPrometheusEnabled(config: Partial<AspenConf.Application>): boolean {
		return !!config.prometheus?.enabled
	}

	static forRoot(load: Array<ConfigFactory | Partial<AspenConf.Application>>, rootModule: Type<any>): IEntryNestModule {
		const entityPattern = `${process.cwd()}/dist/**/*.entity{.ts,.js}`
		const normalized = load.map((item) => (typeof item === "function" ? item : () => item))
		const bootstrapConfig = normalized.reduce((config, factory) => {
			return Object.assign(config, factory())
		}, {} as Partial<AspenConf.Application>)

		return {
			global: true,
			module: ApplicationModule,
			imports: [
				rootModule,
				// 引入配置模块(全局)
				ConfigModule.forRoot({ load: normalized }),
				// 引入 Tempo 链路追踪模块(全局)
				TempoModule.forRoot({ enabled: this.isTempoEnabled(bootstrapConfig) }),
				// 引入 Prometheus 指标模块(全局)
				PrometheusModule.forRoot({ enabled: this.isPrometheusEnabled(bootstrapConfig) }),
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
