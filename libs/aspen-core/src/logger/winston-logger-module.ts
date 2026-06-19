import { DynamicModule, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"

import { createWinstonLogger } from "./winston-logger"

export const WINSTON_INSTANCE = "WINSTON_INSTANCE"

@Module({})
export class WinstonLoggerModule {
	static forRoot(): DynamicModule {
		return {
			global: true,
			module: WinstonLoggerModule,
			imports: [ConfigModule],
			providers: [
				{
					provide: WINSTON_INSTANCE,
					useFactory: (configService: ConfigService<AspenConf.Application, true>) => {
						const appCfg = configService.getOrThrow("app", { infer: true })
						const loggerCfg = configService.getOrThrow("logger", { infer: true })
						return createWinstonLogger(appCfg, loggerCfg)
					},
					inject: [ConfigService],
				},
			],
			exports: [WINSTON_INSTANCE],
		}
	}
}
