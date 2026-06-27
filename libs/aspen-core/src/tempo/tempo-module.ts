import { DynamicModule, Global, Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { TEMPO_MODULE_OPTIONS } from "./tempo-constant"
import { TempoService } from "./tempo-service"

export type TempoModuleOptions = {
	/**
	 * 是否启用 Tempo 模块
	 */
	enabled: boolean
}

@Global()
@Module({})
export class TempoModule {
	static forRoot(options: TempoModuleOptions): DynamicModule {
		if (!options.enabled) {
			return {
				global: true,
				module: TempoModule,
			}
		}

		return {
			global: true,
			module: TempoModule,
			imports: [ConfigModule],
			providers: [
				{
					provide: TEMPO_MODULE_OPTIONS,
					useValue: options,
				},
				TempoService,
			],
			exports: [TempoService],
		}
	}
}
