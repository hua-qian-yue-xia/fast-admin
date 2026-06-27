import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { RedisTool } from "@aspen/aspen-core"
import { cache } from "@aspen/aspen-fram"

import { SysDictEntity } from "../entity"
import { SysDictItemEntity, SysDictItemQueryDto, SysDictItemSaveDto } from "../entity"

@Injectable()
export class SysDictItemService {
	private readonly logger = new Logger(SysDictItemService.name)

	constructor(
		@InjectRepository(SysDictEntity) private readonly sysDictRep: Repository<SysDictEntity>,
		@InjectRepository(SysDictItemEntity) private readonly sysDictItemRepo: Repository<SysDictItemEntity>,
		private readonly redisTool: RedisTool,
	) {}

	// 字典项分页
	async page(dto: SysDictItemQueryDto) {
		return dto.createQueryBuilder(this.sysDictItemRepo).pageMany(dto.getSimplePageObj())
	}

	// 根据dictItemId查询字典项
	@cache.able({ key: "sys:dict-item:id", value: ([dictItemId]) => `${dictItemId}`, expiresIn: "2h" })
	async getByDictItemId(dictItemId: string) {
		const dictDetail = await this.sysDictItemRepo.findOne({
			where: {
				id: dictItemId,
			},
		})
		return dictDetail
	}

	// 根据dictCode查询字典项
	async getListBydictCode(dictCode: string) {
		const dict = await this.sysDictRep.findOne({
			where: {
				code: dictCode,
			},
		})
		if (!dict) return []
		const dictDetail = await this.sysDictItemRepo.find({
			where: {
				dict: {
					id: dict.id,
				},
			},
		})
		return dictDetail
	}

	// 新增字典项
	@cache.put({ key: "sys:dict-item:id", value: (_, result) => `${result.id}`, expiresIn: "2h" })
	async save(body: SysDictItemSaveDto) {
		const saveObj = await this.sysDictItemRepo.save(body.toEntity())
		return saveObj
	}

	// 修改字典项
	@cache.evict({ key: "sys:dict-item:id", value: ([body]) => `${body.id}` })
	async edit(body: SysDictItemSaveDto) {
		await this.sysDictItemRepo.update({ id: body.id }, body.toEntity())
	}

	// 删除字典项
	async delByIds(dictIds: Array<number>) {
		// 查询存不存在
		const roleList = await this.sysDictItemRepo.find({ where: { id: In(dictIds) } })
		if (!roleList.length) return 0
		// 删除数据
		const { affected } = await this.sysDictItemRepo.softDelete(dictIds)
		// 删除缓存
		this.redisTool.del(roleList.map((v) => `sys:dict-item:id:${v.id}`))
		return affected ?? 0
	}
}
