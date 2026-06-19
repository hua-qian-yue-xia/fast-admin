import { Injectable, OnModuleInit, SetMetadata, RequestMethod } from "@nestjs/common"
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core"
import { PATH_METADATA, METHOD_METADATA } from "@nestjs/common/constants"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { ConfigService } from "@nestjs/config"

import { DecoratorKey, EMIT_KEY } from "../../constant"

export type TagType = "callback" | "white" | "third"

export const AspenTag = (type: Array<TagType> = []) => SetMetadata(DecoratorKey.Tag, type)

/**
 * 启动阶段扫描到的接口标签缓存项。
 */
type TagItem = {
	type: Array<TagType>
	path: string
	method: string
}

/**
 * 标签接口发现事件载荷。
 */
export type AspenTagRecord = {
	appName?: string
	appDescription?: string
	appVersion?: string
	appPrefix?: string
	tag: Array<TagType>
	path: string
	method: string
	createTime: Date
}

@Injectable()
export class TagService implements OnModuleInit {
	/**
	 * 已扫描出的接口标签列表，供运行期快速匹配使用。
	 */
	public tagList: Array<TagItem> = []

	constructor(
		private readonly reflector: Reflector,
		private readonly discoveryService: DiscoveryService,
		private readonly metadataScanner: MetadataScanner,
		private readonly eventEmitter: EventEmitter2,
		private readonly configService: ConfigService<AspenConf.Application, true>,
	) {}

	/**
	 * 判断当前请求路径与方法是否命中已标记接口。
	 */
	isTag(path: string, method: string) {
		return this.tagList.some((item) => item.path === path && item.method === method)
	}

	onModuleInit(): void {
		this.getTagList()
	}

	/**
	 * 启动时扫描控制器上的 Tag 元数据，缓存到本地并广播发现事件。
	 */
	getTagList() {
		const appConfig = this.configService.get("app", { infer: true })
		this.discoveryService
			.getControllers()
			.filter((wrapper) => wrapper.isDependencyTreeStatic())
			.filter((wrapper) => wrapper.instance)
			.forEach((v) => {
				const { instance } = v
				const controllerPath = this.reflector.get(PATH_METADATA, v.metatype)
				this.metadataScanner.getAllMethodNames(instance).forEach((name) => {
					const path = this.reflector.get(PATH_METADATA, instance[name])
					const method = this.reflector.get(METHOD_METADATA, instance[name])
					const anonymous = this.reflector.get<TagType | Array<TagType>>(DecoratorKey.Tag, instance[name])
					let whitePath = `${controllerPath}${path}`
					if (!whitePath.startsWith("/")) whitePath = `/${whitePath}`
					if (anonymous) {
						const tagTypes = Array.isArray(anonymous) ? anonymous : [anonymous]
						const tagItem: TagItem = {
							type: tagTypes,
							path: whitePath,
							method: RequestMethod[method],
						}
						this.tagList.push(tagItem)
						this.eventEmitter.emit(EMIT_KEY.Tag, {
							appName: appConfig?.name,
							appDescription: appConfig?.description,
							appVersion: appConfig?.version,
							appPrefix: appConfig?.prefix,
							tag: tagItem.type,
							path: tagItem.path,
							method: tagItem.method,
							createTime: new Date(),
						} satisfies AspenTagRecord)
					}
				})
			})
	}
}
