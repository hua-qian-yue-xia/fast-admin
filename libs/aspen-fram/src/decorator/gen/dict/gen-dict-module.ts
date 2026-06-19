import { DynamicModule, Global, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"

import { GenDictService } from "./gen-dict-decorator"

/**
 * GenDict 动态模块
 */
@Global()
@Module({})
export class GenDictModule {
	static forRoot(): DynamicModule {
		return {
			module: GenDictModule,
			imports: [ConfigModule],
			providers: [ConfigService, GenDictService],
			exports: [GenDictService],
		}
	}
}
