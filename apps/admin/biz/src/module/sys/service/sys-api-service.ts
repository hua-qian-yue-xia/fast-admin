import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { AspenTagRecord } from "@aspen/aspen-fram"

import { SysApiEntity, SysApiTagRelEntity } from "../entity"

@Injectable()
export class SysApiService {
	private readonly logger = new Logger(SysApiService.name)

	constructor(
		@InjectRepository(SysApiEntity)
		private readonly sysApiRepo: Repository<SysApiEntity>,
		@InjectRepository(SysApiTagRelEntity)
		private readonly sysApiTagRelRepo: Repository<SysApiTagRelEntity>,
	) {}

	/**
	 * 批量同步启动阶段发现到的接口标签。
	 */
	async batchSyncDiscoveredApiTags(records: Array<AspenTagRecord>) {
		if (!records.length) {
			return
		}
		const normalizedRecords = this.mergeRecords(records)
		const candidateList = normalizedRecords.map((record) => {
			const entity = new SysApiEntity()
			entity.appName = record.appName
			entity.path = record.path
			entity.method = record.method
			entity.tagList = [...record.tag].sort().map((tag) => {
				const tagRel = new SysApiTagRelEntity()
				tagRel.tag = tag
				return tagRel
			})
			entity.hash = entity.generateHash()
			return entity
		})
		const exactHashList = await this.sysApiRepo.find({
			where: candidateList.map((item) => ({
				hash: item.hash,
			})),
			relations: {
				tagList: true,
			},
		})
		const exactHashSet = new Set(exactHashList.map((item) => item.hash))
		const existedSameApiList = await this.sysApiRepo.find({
			where: candidateList.map((item) => ({
				appName: item.appName,
				method: item.method,
				path: item.path,
			})),
			relations: {
				tagList: true,
			},
		})
		const existedSameApiMap = new Map<string, SysApiEntity>()
		for (const item of existedSameApiList) {
			const identityKey = `${item.appName ?? ""}::${item.method}::${item.path}`
			existedSameApiMap.set(identityKey, item)
		}
		const saveList: Array<SysApiEntity> = []
		const removedApiIds: Array<string> = []
		for (const candidate of candidateList) {
			if (exactHashSet.has(candidate.hash)) {
				continue
			}
			const identityKey = `${candidate.appName ?? ""}::${candidate.method}::${candidate.path}`
			const existed = existedSameApiMap.get(identityKey)
			if (existed) {
				existed.appName = candidate.appName
				existed.path = candidate.path
				existed.method = candidate.method
				existed.tagList = candidate.tagList
				existed.hash = candidate.hash
				saveList.push(existed)
				removedApiIds.push(existed.id)
				continue
			}
			saveList.push(candidate)
		}
		if (removedApiIds.length) {
			await this.sysApiTagRelRepo.delete({
				apiId: In(removedApiIds),
			})
		}
		if (saveList.length) {
			await this.sysApiRepo.save(saveList)
		}
		this.logger.log(`接口标签批量同步完成，本次接收 ${normalizedRecords.length} 条，实际写入 ${saveList.length} 条`)
	}

	/**
	 * 合并同一接口的多次发现结果，并去重标签。
	 */
	private mergeRecords(records: Array<AspenTagRecord>) {
		const map = new Map<
			string,
			{
				appName?: string
				path: string
				method: string
				tag: Set<string>
			}
		>()

		for (const record of records) {
			const key = `${record.appName ?? ""}::${record.method}::${record.path}`
			const existed = map.get(key)
			if (existed) {
				for (const tag of record.tag) {
					existed.tag.add(tag)
				}
				continue
			}

			map.set(key, {
				appName: record.appName,
				path: record.path,
				method: record.method,
				tag: new Set(record.tag),
			})
		}

		return [...map.values()].map((item) => ({
			appName: item.appName,
			path: item.path,
			method: item.method,
			tag: [...item.tag],
			createTime: new Date(),
		}))
	}
}
