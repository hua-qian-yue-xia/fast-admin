import { Injectable, OnApplicationBootstrap, SetMetadata, Type } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EventEmitter2 } from "@nestjs/event-emitter"

import { GenDictRegistry } from "./gen-dict-share"

import { DecoratorKey, EMIT_KEY } from "../../../constant/index"
import { AbstractEnumGroup } from "../../../base/base-enum"

/******************** start type start ********************/

export type GenDictOptions = {
	/**
	 * 字段唯一key
	 */
	key: string

	/**
	 * 字典主要描述
	 */
	summary: string

	/**
	 * 字典排序
	 * @default 0
	 */
	order?: number
}

/******************** end type end ********************/

export const GenGroupDict = (options: GenDictOptions) => {
	return function (target: Type) {
		const _options = { ...options, order: options.order ?? 0 }
		SetMetadata(DecoratorKey.GenDict, _options)(target)
		GenDictRegistry.getInstance().set(target, _options)
		return target
	}
}

/**
 * 单个字典项事件载荷。
 */
export type AspenGenDictRecordItem = {
	code: string
	summary: string
	sort: number
	hexColor?: string | null
}

/**
 * 自动生成字典发现事件载荷。
 */
export type AspenGenDictRecord = {
	appName?: string
	appDescription?: string
	appVersion?: string
	appPrefix?: string
	groupKey: string
	groupSummary: string
	groupOrder: number
	dictCode: string
	dictSummary: string
	items: Array<AspenGenDictRecordItem>
	createTime: Date
}

@Injectable()
export class GenDictService implements OnApplicationBootstrap {
	constructor(
		private readonly eventEmitter: EventEmitter2,
		private readonly configService: ConfigService<AspenConf.Application, true>,
	) {}

	onApplicationBootstrap(): void {
		this.getEnumList()
	}

	/**
	 * 启动时扫描注册到 GenDictRegistry 的枚举分组，并广播生成字典事件。
	 */
	getEnumList() {
		const appConfig = this.configService.get("app", { infer: true })
		const genDictRegistry = GenDictRegistry.getInstance()
		const keys = genDictRegistry.getKeys()
		if (!keys.length) return

		for (const key of keys) {
			const matedata = genDictRegistry.get(key)
			const instance = new key()
			if (!matedata) continue
			if (!(instance instanceof AbstractEnumGroup)) continue

			if (!instance.list.length) continue
			for (const dictGroup of instance.list) {
				const { code, summary, enum: enumObj } = dictGroup
				const enumItems = enumObj.items
				if (!enumItems.length) continue

				const items = enumItems
					.map((item): AspenGenDictRecordItem | null => {
						const raw = item.raw as { code?: string; summary?: string; sort?: number; hexColor?: string | null } | undefined
						const itemCode = raw?.code ?? null
						const itemSummary = raw?.summary ?? null
						if (!itemCode || !itemSummary) return null

						return {
							code: itemCode,
							summary: itemSummary,
							sort: raw?.sort ?? 0,
							hexColor: raw?.hexColor ?? null,
						}
					})
					.filter((item): item is AspenGenDictRecordItem => item !== null)
				if (!items.length) continue

				this.eventEmitter.emit(EMIT_KEY.GenDict, {
					appName: appConfig?.name,
					appDescription: appConfig?.description,
					appVersion: appConfig?.version,
					appPrefix: appConfig?.prefix,
					groupKey: matedata.key,
					groupSummary: matedata.summary,
					groupOrder: matedata.order ?? 0,
					dictCode: `${matedata.key}_${code}`,
					dictSummary: summary,
					items,
					createTime: new Date(),
				} satisfies AspenGenDictRecord)
			}
		}
	}
}
