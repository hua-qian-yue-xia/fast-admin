import { DynamicModule, Logger, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm"
import { SnakeNamingStrategy } from "typeorm-naming-strategies"
import type { Logger as WinstonLoggerInstance } from "winston"

import { OrmLogger } from "./tool/orm-logger"

import { WINSTON_INSTANCE, WinstonLoggerModule } from "../logger/winston-logger-module"

export type DatabaseModuleOptions = {
	/**
	 * 实体文件路径模式
	 */
	entityPattern: string
	/**
	 * 是否启用数据库模块
	 */
	enabled: boolean
}

@Module({})
export class DatabaseModule {
	static forRoot(options: DatabaseModuleOptions): DynamicModule {
		if (!options?.entityPattern?.trim()) {
			throw new Error("DatabaseModule 配置缺失: entityPattern")
		}

		if (!options.enabled) {
			return {
				global: true,
				module: DatabaseModule,
			}
		}

		const winstonLoggerModule = WinstonLoggerModule.forRoot()

		return {
			global: true,
			module: DatabaseModule,
			imports: [
				ConfigModule,
				winstonLoggerModule,
				TypeOrmModule.forRootAsync({
					imports: [ConfigModule, winstonLoggerModule],
					inject: [ConfigService, WINSTON_INSTANCE],
					useFactory: (config: ConfigService<AspenConf.Application, true>, winstonLogger: WinstonLoggerInstance): TypeOrmModuleOptions => {
						const logger = new Logger(DatabaseModule.name)
						const databaseConfig = config.getOrThrow("database", { infer: true })

						const missingFields = [
							!databaseConfig.type ? "database.type" : null,
							!databaseConfig.host?.trim() ? "database.host" : null,
							databaseConfig.port == null ? "database.port" : null,
							!databaseConfig.username?.trim() ? "database.username" : null,
							!databaseConfig.password?.trim() ? "database.password" : null,
							!databaseConfig.database?.trim() ? "database.database" : null,
						].filter(Boolean)

						if (missingFields.length > 0) {
							throw new Error(`Database 配置缺失: ${missingFields.join(", ")}`)
						}

						logger.debug(
							`连接数据库参数type:<${databaseConfig.type}>host:<${databaseConfig.host}>port:<${databaseConfig.port}>username:<${databaseConfig.username}>password:<${databaseConfig.password}>database:<${databaseConfig.database}>dropSchema:<${databaseConfig.dropSchema}>synchronize:<${databaseConfig.synchronize}>`,
						)

						return {
							type: databaseConfig.type,
							host: databaseConfig.host,
							port: databaseConfig.port,
							username: databaseConfig.username,
							password: databaseConfig.password,
							database: databaseConfig.database,
							dropSchema: databaseConfig.dropSchema,
							synchronize: databaseConfig.synchronize,
							logging: ["error", "warn", "schema", "migration"],
							entities: [options.entityPattern],
							// 自动加载实体
							autoLoadEntities: true,
							namingStrategy: new SnakeNamingStrategy(),
							extra: {
								typeCast: (field: any, next: () => any) => {
									const value: any = next()
									if (Buffer.isBuffer(value) && field.type === "BIT" && value.length === 1) {
										return value[0] === 1
									}
									return value
								},
							},
							logger: new OrmLogger(winstonLogger),
						}
					},
				}),
			],
			providers: [],
			exports: [],
		}
	}
}
