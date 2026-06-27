import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { RedisTool } from "@aspen/aspen-core"
import { AspenGenDictRecord, cache, exception } from "@aspen/aspen-fram"

import { SysDictEntity, SysDictItemEntity, SysDictQueryDto, SysDictSaveDto } from "../entity"
import { plainToInstance } from "class-transformer"

@Injectable()
export class SysDictService {
	private readonly logger = new Logger(SysDictService.name)

	constructor(
		@InjectRepository(SysDictEntity) private readonly sysDictRepo: Repository<SysDictEntity>,
		@InjectRepository(SysDictItemEntity) private readonly sysDictItemRepo: Repository<SysDictItemEntity>,
		private readonly redisTool: RedisTool,
	) {}

	/**
	 * 批量同步启动阶段自动发现到的字典定义。
	 *
	 * 同步规则：
	 * 1. 字典主表以 `dictCode` 作为身份标识；
	 * 2. 字典项以 `hash` 判断是否与数据库完全一致；
	 * 3. 同 `code` 但 `hash` 变化时执行更新；
	 * 4. 新项直接新增。
	 *
	 * 当前实现不会主动删除数据库里“本次未出现”的旧字典项，
	 * 这样可以避免在枚举收敛或临时缺失时误删已有数据。
	 */
	async batchSyncDiscoveredDicts(records: Array<AspenGenDictRecord>) {
		if (!records.length) {
			return
		}

		const normalizedRecords = this.mergeDiscoveredDicts(records)
		const existedDictList = await this.sysDictRepo.find({
			where: normalizedRecords.map((item) => ({
				code: item.dictCode,
			})),
		})
		const existedDictMap = new Map(existedDictList.map((item) => [item.code, item]))

		const dictSaveList: Array<SysDictEntity> = []
		for (const record of normalizedRecords) {
			const existed = existedDictMap.get(record.dictCode)
			if (existed) {
				existed.summary = record.dictSummary
				existed.sort = record.groupOrder ?? 0
				existed.genType = "1"
				dictSaveList.push(existed)
				continue
			}

			const entity = new SysDictEntity()
			entity.code = record.dictCode
			entity.summary = record.dictSummary
			entity.sort = record.groupOrder ?? 0
			entity.genType = "1"
			dictSaveList.push(entity)
		}

		const savedDictList = dictSaveList.length ? await this.sysDictRepo.save(dictSaveList) : []
		const dictMap = new Map(savedDictList.map((item) => [item.code, item]))

		const dictItemSaveList: Array<SysDictItemEntity> = []
		for (const record of normalizedRecords) {
			const dict = dictMap.get(record.dictCode)
			if (!dict) {
				continue
			}

			const existedItemList = await this.sysDictItemRepo.find({
				where: {
					dict: {
						id: dict.id,
					},
				},
				relations: {
					dict: true,
				},
			})
			const existedItemHashSet = new Set(existedItemList.map((item) => item.hash))
			const existedItemCodeMap = new Map(existedItemList.map((item) => [item.code, item]))

			for (const item of record.items) {
				const entity = new SysDictItemEntity()
				entity.dict = dict
				entity.code = item.code
				entity.summary = item.summary
				entity.hexColor = item.hexColor ?? null
				entity.sort = item.sort ?? 0
				entity.hash = entity.generateHash()

				if (existedItemHashSet.has(entity.hash)) {
					continue
				}

				const existed = existedItemCodeMap.get(entity.code)
				if (existed) {
					existed.dict = dict
					existed.code = entity.code
					existed.summary = entity.summary
					existed.hexColor = entity.hexColor
					existed.sort = entity.sort
					existed.hash = entity.hash
					dictItemSaveList.push(existed)
					continue
				}

				dictItemSaveList.push(entity)
			}
		}

		if (dictItemSaveList.length) {
			await this.sysDictItemRepo.save(dictItemSaveList)
		}

		this.logger.log(
			`自动字典同步完成，本次接收 ${normalizedRecords.length} 组字典，写入 ${savedDictList.length} 个字典，写入 ${dictItemSaveList.length} 个字典项`,
		)
	}

	async page(dto: SysDictQueryDto) {
		return await dto.createQueryBuilder(this.sysDictRepo).pageMany(dto.getSimplePageObj())
	}

	// 查询所有字典code
	async allDictCode() {
		const list = await this.sysDictRepo.find({
			select: {
				code: true,
			},
		})
		return list.map((v) => v.code)
	}

	// 根据dictId查询字典
	@cache.able({ key: "sys:dict:id", value: ([dictId]) => `${dictId}`, expiresIn: "2h" })
	async getByDictId(dictId: string) {
		const dictDetail = await this.sysDictRepo.findOne({
			where: {
				id: dictId,
			},
		})
		return dictDetail
	}

	// 新增字典
	@cache.put({ key: "sys:dict:id", value: (_, result) => `${result.id}`, expiresIn: "2h" })
	async save(body: SysDictSaveDto) {
		if (await this.isDictCodeDuplicate(body.code)) {
			throw new exception.validator(`字典code"${body.code}"重复`)
		}
		const obj = plainToInstance(SysDictEntity, body)
		obj.genType = "2"
		const saveObj = await this.sysDictRepo.save(obj)
		return saveObj
	}

	// 修改字典
	@cache.evict({ key: "sys:dict:id", value: ([dto]) => `${dto.id}` })
	async edit(body: SysDictSaveDto) {
		if (await this.isDictCodeDuplicate(body.code, body.id)) {
			throw new exception.validator(`字典code"${body.code}"重复`)
		}
		const obj = plainToInstance(SysDictEntity, body)
		obj.genType = "2"
		await this.sysDictRepo.update({ id: body.id }, obj)
	}

	// 删除字典
	async delByIds(dictIds: Array<string>) {
		// 查询存不存在
		const dictList = await this.sysDictRepo.find({ where: { id: In(dictIds) } })
		if (!dictList.length) return 0
		// 删除数据
		const { affected } = await this.sysDictRepo.softDelete(dictIds)
		// 删除缓存
		this.redisTool.del(dictList.map((v) => `sys:dict:id:${v.id}`))
		return affected ?? 0
	}

	// 字典code是否重复
	async isDictCodeDuplicate(dictCode: string, dictId?: string): Promise<boolean> {
		const queryBuilder = this.sysDictRepo.createQueryBuilder("dict").where("dict.code = :dictCode", { dictCode })
		if (dictId) {
			queryBuilder.andWhere("dict.id != :dictId", { dictId })
		}
		const count = await queryBuilder.getCount()
		return count > 0
	}

	/**
	 * 合并同一批次中重复发现的字典记录，并按字典项 code 去重。
	 */
	private mergeDiscoveredDicts(records: Array<AspenGenDictRecord>) {
		const map = new Map<
			string,
			{
				groupOrder: number
				dictCode: string
				dictSummary: string
				items: Map<string, AspenGenDictRecord["items"][number]>
			}
		>()

		for (const record of records) {
			const existed = map.get(record.dictCode)
			if (existed) {
				existed.groupOrder = record.groupOrder ?? existed.groupOrder
				existed.dictSummary = record.dictSummary
				for (const item of record.items) {
					existed.items.set(item.code, item)
				}
				continue
			}

			map.set(record.dictCode, {
				groupOrder: record.groupOrder ?? 0,
				dictCode: record.dictCode,
				dictSummary: record.dictSummary,
				items: new Map(record.items.map((item) => [item.code, item])),
			})
		}

		return [...map.values()].map((item) => ({
			groupOrder: item.groupOrder,
			dictCode: item.dictCode,
			dictSummary: item.dictSummary,
			items: [...item.items.values()],
		}))
	}
}
