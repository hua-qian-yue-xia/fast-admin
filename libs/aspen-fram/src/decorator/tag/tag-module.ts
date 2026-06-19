import { Module } from "@nestjs/common"
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { ConfigModule, ConfigService } from "@nestjs/config"

import { TagService } from "./tag-decorator"

@Module({})
export class TagModule {
	static forRoot() {
		return {
			module: TagModule,
			global: true,
			imports: [ConfigModule],
			providers: [TagService, DiscoveryService, MetadataScanner, Reflector, ConfigService],
			exports: [TagService],
		}
	}
}
